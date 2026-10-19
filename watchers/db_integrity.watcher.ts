/**
 * Database Integrity Watcher
 * Validates referential integrity and data consistency
 * Runs nightly and reports issues via GitHub Issues
 */

import { createClient } from '@supabase/supabase-js';
import { Octokit } from '@octokit/rest';
import { createComponentLogger } from '@whats-for-dinner/utils';

const logger = createComponentLogger('db-integrity-watcher-ts');
interface IntegrityCheck {
  table: string;
  check_type: 'foreign_key' | 'constraint' | 'data_type' | 'null_constraint';
  status: 'pass' | 'fail' | 'warning';
  message: string;
  affected_rows?: number;
  query?: string;
}

interface IntegrityReport {
  timestamp: string;
  total_checks: number;
  passed: number;
  failed: number;
  warnings: number;
  checks: IntegrityCheck[];
  recommendations: string[];
}

class DatabaseIntegrityWatcher {
  private supabase: any;
  private octokit: Octokit;
  private projectRef: string;

  constructor() {
    // Extract project ref from URL or use explicit env var
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const urlMatch = supabaseUrl?.match(/https:\/\/([^.]+)\.supabase\.co/);
    this.projectRef = process.env.SUPABASE_PROJECT_REF || urlMatch?.[1] || '';
    
    this.supabase = createClient(
      supabaseUrl || `https://${this.projectRef}.supabase.co`,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || ''
    );
    
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });
  }

  /**
   * Run comprehensive database integrity checks
   */
  async runIntegrityChecks(): Promise<IntegrityReport> {
    
    const checks: IntegrityCheck[] = [];
    const recommendations: string[] = [];

    try {
      // Check foreign key constraints
      checks.push(...await this.checkForeignKeyConstraints());
      
      // Check data type consistency
      checks.push(...await this.checkDataTypeConsistency());
      
      // Check null constraints
      checks.push(...await this.checkNullConstraints());
      
      // Check unique constraints
      checks.push(...await this.checkUniqueConstraints());
      
      // Check check constraints
      checks.push(...await this.checkCheckConstraints());

      // Generate recommendations
      recommendations.push(...this.generateRecommendations(checks));

      const report: IntegrityReport = {
        timestamp: new Date().toISOString(),
        total_checks: checks.length,
        passed: checks.filter(c => c.status === 'pass').length,
        failed: checks.filter(c => c.status === 'fail').length,
        warnings: checks.filter(c => c.status === 'warning').length,
        checks,
        recommendations
      };

      // Store report
      await this.storeReport(report);

      // Create GitHub issue if critical issues found
      if (report.failed > 0) {
        await this.createIntegrityIssue(report);
      }

      return report;
    } catch (error) {
      logger.error('Database integrity check failed:', { error });
      throw error;
    }
  }

  /**
   * Check foreign key constraints
   */
  private async checkForeignKeyConstraints(): Promise<IntegrityCheck[]> {
    const checks: IntegrityCheck[] = [];

    try {
      // Get all foreign key relationships
      const { data: fkRelations, error } = await this.supabase.rpc('get_foreign_keys');
      
      if (error) {
        logger.error('Failed to get foreign key relations:', { error });
        return checks;
      }

      for (const relation of fkRelations || []) {
        // Check for orphaned records
        const orphanQuery = `
          SELECT COUNT(*) as count
          FROM ${relation.child_table} c
          LEFT JOIN ${relation.parent_table} p 
            ON c.${relation.child_column} = p.${relation.parent_column}
          WHERE p.${relation.parent_column} IS NULL
        `;

        const { data: orphanResult, error: orphanError } = await this.supabase
          .rpc('exec_sql', { sql: orphanQuery });

        if (orphanError) {
          checks.push({
            table: relation.child_table,
            check_type: 'foreign_key',
            status: 'fail',
            message: `Failed to check orphaned records: ${orphanError.message}`,
            query: orphanQuery
          });
        } else {
          const orphanCount = orphanResult?.[0]?.count || 0;
          
          checks.push({
            table: relation.child_table,
            check_type: 'foreign_key',
            status: orphanCount > 0 ? 'fail' : 'pass',
            message: orphanCount > 0 
              ? `Found ${orphanCount} orphaned records in ${relation.child_table}.${relation.child_column}`
              : `No orphaned records found in ${relation.child_table}.${relation.child_column}`,
            affected_rows: orphanCount,
            query: orphanQuery
          });
        }
      }
    } catch (error) {
      logger.error('Foreign key check failed:', { error });
      checks.push({
        table: 'unknown',
        check_type: 'foreign_key',
        status: 'fail',
        message: `Foreign key check failed: ${error.message}`
      });
    }

    return checks;
  }

  /**
   * Check data type consistency
   */
  private async checkDataTypeConsistency(): Promise<IntegrityCheck[]> {
    const checks: IntegrityCheck[] = [];

    try {
      // Check for invalid UUIDs
      const uuidQuery = `
        SELECT table_name, column_name, COUNT(*) as invalid_count
        FROM information_schema.columns c
        JOIN information_schema.tables t ON c.table_name = t.table_name
        WHERE c.data_type = 'uuid' 
          AND t.table_schema = 'public'
        GROUP BY table_name, column_name
        HAVING COUNT(*) > 0
      `;

      const { data: uuidColumns, error: uuidError } = await this.supabase
        .rpc('exec_sql', { sql: uuidQuery });

      if (uuidError) {
        checks.push({
          table: 'information_schema',
          check_type: 'data_type',
          status: 'fail',
          message: `Failed to check UUID columns: ${uuidError.message}`
        });
      } else {
        for (const column of uuidColumns || []) {
          const invalidUuidQuery = `
            SELECT COUNT(*) as count
            FROM ${column.table_name}
            WHERE ${column.column_name} IS NOT NULL 
              AND ${column.column_name}::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          `;

          const { data: invalidResult, error: invalidError } = await this.supabase
            .rpc('exec_sql', { sql: invalidUuidQuery });

          if (invalidError) {
            checks.push({
              table: column.table_name,
              check_type: 'data_type',
              status: 'fail',
              message: `Failed to validate UUID in ${column.table_name}.${column.column_name}: ${invalidError.message}`,
              query: invalidUuidQuery
            });
          } else {
            const invalidCount = invalidResult?.[0]?.count || 0;
            
            checks.push({
              table: column.table_name,
              check_type: 'data_type',
              status: invalidCount > 0 ? 'fail' : 'pass',
              message: invalidCount > 0 
                ? `Found ${invalidCount} invalid UUIDs in ${column.table_name}.${column.column_name}`
                : `All UUIDs valid in ${column.table_name}.${column.column_name}`,
              affected_rows: invalidCount,
              query: invalidUuidQuery
            });
          }
        }
      }
    } catch (error) {
      logger.error('Data type consistency check failed:', { error });
      checks.push({
        table: 'unknown',
        check_type: 'data_type',
        status: 'fail',
        message: `Data type consistency check failed: ${error.message}`
      });
    }

    return checks;
  }

  /**
   * Check null constraints
   */
  private async checkNullConstraints(): Promise<IntegrityCheck[]> {
    const checks: IntegrityCheck[] = [];

    try {
      // Get all NOT NULL columns
      const nullQuery = `
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE is_nullable = 'NO' 
          AND table_schema = 'public'
          AND table_name NOT LIKE 'pg_%'
      `;

      const { data: notNullColumns, error: nullError } = await this.supabase
        .rpc('exec_sql', { sql: nullQuery });

      if (nullError) {
        checks.push({
          table: 'information_schema',
          check_type: 'null_constraint',
          status: 'fail',
          message: `Failed to get NOT NULL columns: ${nullError.message}`
        });
      } else {
        for (const column of notNullColumns || []) {
          const nullCheckQuery = `
            SELECT COUNT(*) as count
            FROM ${column.table_name}
            WHERE ${column.column_name} IS NULL
          `;

          const { data: nullResult, error: nullCheckError } = await this.supabase
            .rpc('exec_sql', { sql: nullCheckQuery });

          if (nullCheckError) {
            checks.push({
              table: column.table_name,
              check_type: 'null_constraint',
              status: 'fail',
              message: `Failed to check NULL values in ${column.table_name}.${column.column_name}: ${nullCheckError.message}`,
              query: nullCheckQuery
            });
          } else {
            const nullCount = nullResult?.[0]?.count || 0;
            
            checks.push({
              table: column.table_name,
              check_type: 'null_constraint',
              status: nullCount > 0 ? 'fail' : 'pass',
              message: nullCount > 0 
                ? `Found ${nullCount} NULL values in NOT NULL column ${column.table_name}.${column.column_name}`
                : `No NULL values in NOT NULL column ${column.table_name}.${column.column_name}`,
              affected_rows: nullCount,
              query: nullCheckQuery
            });
          }
        }
      }
    } catch (error) {
      logger.error('NULL constraint check failed:', { error });
      checks.push({
        table: 'unknown',
        check_type: 'null_constraint',
        status: 'fail',
        message: `NULL constraint check failed: ${error.message}`
      });
    }

    return checks;
  }

  /**
   * Check unique constraints
   */
  private async checkUniqueConstraints(): Promise<IntegrityCheck[]> {
    const checks: IntegrityCheck[] = [];

    try {
      // Get all unique constraints
      const uniqueQuery = `
        SELECT 
          tc.table_name,
          kcu.column_name,
          tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'UNIQUE'
          AND tc.table_schema = 'public'
      `;

      const { data: uniqueConstraints, error: uniqueError } = await this.supabase
        .rpc('exec_sql', { sql: uniqueQuery });

      if (uniqueError) {
        checks.push({
          table: 'information_schema',
          check_type: 'constraint',
          status: 'fail',
          message: `Failed to get unique constraints: ${uniqueError.message}`
        });
      } else {
        for (const constraint of uniqueConstraints || []) {
          const duplicateQuery = `
            SELECT ${constraint.column_name}, COUNT(*) as count
            FROM ${constraint.table_name}
            GROUP BY ${constraint.column_name}
            HAVING COUNT(*) > 1
          `;

          const { data: duplicateResult, error: duplicateError } = await this.supabase
            .rpc('exec_sql', { sql: duplicateQuery });

          if (duplicateError) {
            checks.push({
              table: constraint.table_name,
              check_type: 'constraint',
              status: 'fail',
              message: `Failed to check unique constraint ${constraint.constraint_name}: ${duplicateError.message}`,
              query: duplicateQuery
            });
          } else {
            const duplicateCount = duplicateResult?.length || 0;
            
            checks.push({
              table: constraint.table_name,
              check_type: 'constraint',
              status: duplicateCount > 0 ? 'fail' : 'pass',
              message: duplicateCount > 0 
                ? `Found ${duplicateCount} duplicate values in unique column ${constraint.table_name}.${constraint.column_name}`
                : `No duplicates in unique column ${constraint.table_name}.${constraint.column_name}`,
              affected_rows: duplicateCount,
              query: duplicateQuery
            });
          }
        }
      }
    } catch (error) {
      logger.error('Unique constraint check failed:', { error });
      checks.push({
        table: 'unknown',
        check_type: 'constraint',
        status: 'fail',
        message: `Unique constraint check failed: ${error.message}`
      });
    }

    return checks;
  }

  /**
   * Check check constraints
   */
  private async checkCheckConstraints(): Promise<IntegrityCheck[]> {
    const checks: IntegrityCheck[] = [];

    try {
      // Get all check constraints
      const checkQuery = `
        SELECT 
          tc.table_name,
          tc.constraint_name,
          cc.check_clause
        FROM information_schema.table_constraints tc
        JOIN information_schema.check_constraints cc 
          ON tc.constraint_name = cc.constraint_name
        WHERE tc.constraint_type = 'CHECK'
          AND tc.table_schema = 'public'
      `;

      const { data: checkConstraints, error: checkError } = await this.supabase
        .rpc('exec_sql', { sql: checkQuery });

      if (checkError) {
        checks.push({
          table: 'information_schema',
          check_type: 'constraint',
          status: 'fail',
          message: `Failed to get check constraints: ${checkError.message}`
        });
      } else {
        for (const constraint of checkConstraints || []) {
          const violationQuery = `
            SELECT COUNT(*) as count
            FROM ${constraint.table_name}
            WHERE NOT (${constraint.check_clause})
          `;

          const { data: violationResult, error: violationError } = await this.supabase
            .rpc('exec_sql', { sql: violationQuery });

          if (violationError) {
            checks.push({
              table: constraint.table_name,
              check_type: 'constraint',
              status: 'fail',
              message: `Failed to check constraint ${constraint.constraint_name}: ${violationError.message}`,
              query: violationQuery
            });
          } else {
            const violationCount = violationResult?.[0]?.count || 0;
            
            checks.push({
              table: constraint.table_name,
              check_type: 'constraint',
              status: violationCount > 0 ? 'fail' : 'pass',
              message: violationCount > 0 
                ? `Found ${violationCount} check constraint violations in ${constraint.table_name}`
                : `No check constraint violations in ${constraint.table_name}`,
              affected_rows: violationCount,
              query: violationQuery
            });
          }
        }
      }
    } catch (error) {
      logger.error('Check constraint check failed:', { error });
      checks.push({
        table: 'unknown',
        check_type: 'constraint',
        status: 'fail',
        message: `Check constraint check failed: ${error.message}`
      });
    }

    return checks;
  }

  /**
   * Generate recommendations based on check results
   */
  private generateRecommendations(checks: IntegrityCheck[]): string[] {
    const recommendations: string[] = [];
    const failedChecks = checks.filter(c => c.status === 'fail');

    if (failedChecks.length > 0) {
      recommendations.push('Immediate action required: Fix database integrity violations');
      
      const fkFailures = failedChecks.filter(c => c.check_type === 'foreign_key');
      if (fkFailures.length > 0) {
        recommendations.push('Review and fix foreign key constraint violations');
      }

      const nullFailures = failedChecks.filter(c => c.check_type === 'null_constraint');
      if (nullFailures.length > 0) {
        recommendations.push('Address NULL values in NOT NULL columns');
      }

      const uniqueFailures = failedChecks.filter(c => c.check_type === 'constraint');
      if (uniqueFailures.length > 0) {
        recommendations.push('Resolve unique constraint violations');
      }
    }

    const warningChecks = checks.filter(c => c.status === 'warning');
    if (warningChecks.length > 0) {
      recommendations.push('Review warning-level integrity issues');
    }

    if (checks.length === 0) {
      recommendations.push('No integrity checks were performed - verify database connection');
    }

    return recommendations;
  }

  /**
   * Store integrity report
   */
  private async storeReport(report: IntegrityReport) {
    try {
      const { error } = await this.supabase
        .from('ai_integrity_reports')
        .insert([report]);

      if (error) {
        logger.error('Error storing integrity report:', { error });
      } else {
              }
    } catch (error) {
      logger.error('Failed to store integrity report:', { error });
    }
  }

  /**
   * Create GitHub issue for critical integrity violations
   */
  private async createIntegrityIssue(report: IntegrityReport) {
    const issue = {
      title: `🚨 Database Integrity Violations Detected (${report.failed} failures)`,
      body: this.generateIntegrityIssueBody(report),
      labels: ['database', 'integrity', 'critical', 'automated']
    };

    try {
      const { data } = await this.octokit.rest.issues.create({
        owner: process.env.GITHUB_OWNER || 'your-org',
        repo: process.env.GITHUB_REPO || 'whats-for-dinner-monorepo',
        title: issue.title,
        body: issue.body,
        labels: issue.labels
      });

          } catch (error) {
      logger.error('Failed to create integrity issue:', { error });
    }
  }

  /**
   * Generate GitHub issue body for integrity violations
   */
  private generateIntegrityIssueBody(report: IntegrityReport): string {
    const failedChecks = report.checks.filter(c => c.status === 'fail');
    
    return `
## 🚨 Database Integrity Violations Report

**Timestamp:** ${report.timestamp}  
**Total Checks:** ${report.total_checks}  
**Failed:** ${report.failed}  
**Warnings:** ${report.warnings}  
**Passed:** ${report.passed}

### ❌ Failed Checks

${failedChecks.map(check => `
#### ${check.table} - ${check.check_type.replace('_', ' ').toUpperCase()}
- **Status:** ${check.status.toUpperCase()}
- **Message:** ${check.message}
- **Affected Rows:** ${check.affected_rows || 'N/A'}
${check.query ? `- **Query:** \`${check.query}\`` : ''}
`).join('\n')}

### 📋 Recommendations

${report.recommendations.map(rec => `- ${rec}`).join('\n')}

### 🔧 Next Steps

1. Review failed checks and identify root causes
2. Fix data integrity violations
3. Implement preventive measures
4. Re-run integrity checks to verify fixes

---
*This report was automatically generated by the Database Integrity Watcher.*
    `.trim();
  }

  /**
   * Run nightly integrity check
   */
  async runNightlyCheck() {
        
    try {
      const report = await this.runIntegrityChecks();
      
            
      if (report.failed > 0) {
              }
      
      if (report.warnings > 0) {
              }
    } catch (error) {
      logger.error('Nightly integrity check failed:', { error });
    }
  }
}

export default DatabaseIntegrityWatcher;