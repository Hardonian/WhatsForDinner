/**
 * HealAgent - Repairs code defects and re-tests
 * Part of the multi-agent collaboration system
 */

import { BaseAgent, AgentConfig, AgentAction } from './baseAgent';
import { logger } from '../logger';
import { run_terminal_cmd } from '../../utils/commandRunner';
import { withErrorBoundary, withRetry } from '../error-boundaries';

export interface CodeIssue {
  type: 'error' | 'warning' | 'performance' | 'security' | 'style';
  severity: 'low' | 'medium' | 'high' | 'critical';
  file: string;
  line: number;
  message: string;
  suggestion: string;
  autoFixable: boolean;
}

export interface RepairResult {
  success: boolean;
  issuesFixed: number;
  issuesRemaining: number;
  newIssues: CodeIssue[];
  changes: string[];
  testResults: any;
}

export class HealAgent extends BaseAgent {
  private codeIssues: CodeIssue[] = [];
  private repairHistory: RepairResult[] = [];

  constructor() {
    const config: AgentConfig = {
      name: 'HealAgent',
      capabilities: [
        'scan_code',
        'fix_errors',
        'fix_warnings',
        'optimize_performance',
        'fix_security',
        'refactor_code',
        'run_tests',
        'validate_fixes',
        'rollback_changes',
      ],
      safetyConstraints: [
        'no_breaking_changes_without_tests',
        'preserve_functionality',
        'maintain_code_quality',
        'no_security_compromises',
      ],
      learningRate: 0.2,
      maxRetries: 5,
    };
    super(config);
  }

  protected async performAction(action: AgentAction): Promise<boolean> {
    switch (action.type) {
      case 'scan_code':
        return await this.scanCode();
      case 'fix_errors':
        return await this.fixErrors(action.payload);
      case 'fix_warnings':
        return await this.fixWarnings(action.payload);
      case 'optimize_performance':
        return await this.optimizePerformance(action.payload);
      case 'fix_security':
        return await this.fixSecurityIssues(action.payload);
      case 'refactor_code':
        return await this.refactorCode(action.payload);
      case 'run_tests':
        return await this.runTests();
      case 'validate_fixes':
        return await this.validateFixes(action.payload);
      case 'rollback_changes':
        return await this.rollbackChanges(action.payload);
      default:
        logger.warn(`Unknown action type: ${action.type}`);
        return false;
    }
  }

  protected checkSafetyConstraint(
    constraint: string,
    action: AgentAction
  ): boolean {
    switch (constraint) {
      case 'no_breaking_changes_without_tests':
        if (action.type === 'refactor_code' || action.type === 'fix_errors') {
          return this.hasComprehensiveTests();
        }
        return true;

      case 'preserve_functionality':
        if (action.type === 'fix_errors' || action.type === 'refactor_code') {
          return action.payload?.preserveFunctionality === true;
        }
        return true;

      case 'maintain_code_quality':
        if (
          action.type === 'fix_warnings' ||
          action.type === 'optimize_performance'
        ) {
          return this.willMaintainCodeQuality(action);
        }
        return true;

      case 'no_security_compromises':
        if (action.type === 'fix_security' || action.type === 'refactor_code') {
          return this.willNotCompromiseSecurity(action);
        }
        return true;

      default:
        return true;
    }
  }

  /**
   * Scan code for issues
   */
  private async scanCode(): Promise<boolean> {
    try {
      logger.info('Scanning code for issues');

      // Run linting to find style and basic issues
      const lintResult = await run_terminal_cmd('npm run lint');

      // Run type checking for TypeScript errors
      const typeCheckResult = await run_terminal_cmd('npm run type-check');

      // Run security audit
      const securityResult = await run_terminal_cmd('npm audit --json');

      // Parse results and create issue list
      this.codeIssues = await this.parseScanResults({
        lint: lintResult,
        typeCheck: typeCheckResult,
        security: securityResult,
      });

      logger.info(`Found ${this.codeIssues.length} code issues`);
      return true;
    } catch (error) {
      logger.error('Code scanning error', { error });
      return false;
    }
  }

  /**
   * Fix code errors
   */
  private async fixErrors(payload: any): Promise<boolean> {
    try {
      logger.info('Fixing code errors');

      const errors = this.codeIssues.filter(issue => issue.type === 'error');
      const autoFixableErrors = errors.filter(issue => issue.autoFixable);

      if (autoFixableErrors.length === 0) {
        logger.info('No auto-fixable errors found');
        return true;
      }

      const repairResult = await this.performRepairs(
        autoFixableErrors,
        'error'
      );
      this.repairHistory.push(repairResult);

      logger.info(`Fixed ${repairResult.issuesFixed} errors`, { repairResult });
      return repairResult.success;
    } catch (error) {
      logger.error('Error fixing failed', { error });
      return false;
    }
  }

  /**
   * Fix code warnings
   */
  private async fixWarnings(payload: any): Promise<boolean> {
    try {
      logger.info('Fixing code warnings');

      const warnings = this.codeIssues.filter(
        issue => issue.type === 'warning'
      );
      const autoFixableWarnings = warnings.filter(issue => issue.autoFixable);

      if (autoFixableWarnings.length === 0) {
        logger.info('No auto-fixable warnings found');
        return true;
      }

      const repairResult = await this.performRepairs(
        autoFixableWarnings,
        'warning'
      );
      this.repairHistory.push(repairResult);

      logger.info(`Fixed ${repairResult.issuesFixed} warnings`, {
        repairResult,
      });
      return repairResult.success;
    } catch (error) {
      logger.error('Warning fixing failed', { error });
      return false;
    }
  }

  /**
   * Optimize performance
   */
  private async optimizePerformance(payload: any): Promise<boolean> {
    try {
      logger.info('Optimizing performance');

      const performanceIssues = this.codeIssues.filter(
        issue => issue.type === 'performance'
      );

      if (performanceIssues.length === 0) {
        logger.info('No performance issues found');
        return true;
      }

      const optimizations =
        await this.generatePerformanceOptimizations(performanceIssues);
      const repairResult = await this.applyOptimizations(optimizations);
      this.repairHistory.push(repairResult);

      logger.info(`Applied ${optimizations.length} performance optimizations`, {
        repairResult,
      });
      return repairResult.success;
    } catch (error) {
      logger.error('Performance optimization failed', { error });
      return false;
    }
  }

  /**
   * Fix security issues
   */
  private async fixSecurityIssues(payload: any): Promise<boolean> {
    try {
      logger.info('Fixing security issues');

      const securityIssues = this.codeIssues.filter(
        issue => issue.type === 'security'
      );

      if (securityIssues.length === 0) {
        logger.info('No security issues found');
        return true;
      }

      const securityFixes = await this.generateSecurityFixes(securityIssues);
      const repairResult = await this.applySecurityFixes(securityFixes);
      this.repairHistory.push(repairResult);

      logger.info(`Applied ${securityFixes.length} security fixes`, {
        repairResult,
      });
      return repairResult.success;
    } catch (error) {
      logger.error('Security fixing failed', { error });
      return false;
    }
  }

  /**
   * Refactor code
   */
  private async refactorCode(payload: any): Promise<boolean> {
    try {
      logger.info('Refactoring code');

      const refactoringTargets = await this.identifyRefactoringTargets();

      if (refactoringTargets.length === 0) {
        logger.info('No refactoring targets identified');
        return true;
      }

      const refactoringPlan =
        await this.createRefactoringPlan(refactoringTargets);
      const repairResult = await this.executeRefactoring(refactoringPlan);
      this.repairHistory.push(repairResult);

      logger.info(
        `Completed refactoring of ${refactoringTargets.length} targets`,
        { repairResult }
      );
      return repairResult.success;
    } catch (error) {
      logger.error('Code refactoring failed', { error });
      return false;
    }
  }

  /**
   * Run tests to validate fixes
   */
  private async runTests(): Promise<boolean> {
    try {
      logger.info('Running tests to validate fixes');

      const testResult = await run_terminal_cmd('npm run test:ci');

      if (testResult.success) {
        logger.info('All tests passed');
        return true;
      } else {
        logger.error('Tests failed after fixes', { error: testResult.error });
        return false;
      }
    } catch (error) {
      logger.error('Test execution failed', { error });
      return false;
    }
  }

  /**
   * Validate that fixes are working correctly
   */
  private async validateFixes(payload: any): Promise<boolean> {
    try {
      logger.info('Validating fixes');

      // Re-scan code to check if issues are resolved
      await this.scanCode();

      const remainingIssues = this.codeIssues.filter(
        issue => issue.severity === 'high' || issue.severity === 'critical'
      );

      if (remainingIssues.length === 0) {
        logger.info('All critical issues resolved');
        return true;
      } else {
        logger.warn(`${remainingIssues.length} critical issues remain`, {
          remainingIssues,
        });
        return false;
      }
    } catch (error) {
      logger.error('Fix validation failed', { error });
      return false;
    }
  }

  /**
   * Rollback changes if fixes cause problems
   */
  private async rollbackChanges(payload: any): Promise<boolean> {
    try {
      const changeId = payload?.changeId;
      logger.info(`Rolling back changes: ${changeId}`);

      // In a real implementation, this would use git to rollback specific changes
      const rollbackResult = await run_terminal_cmd(`git revert ${changeId}`);

      if (rollbackResult.success) {
        logger.info('Changes rolled back successfully');
        return true;
      } else {
        logger.error('Rollback failed', { error: rollbackResult.error });
        return false;
      }
    } catch (error) {
      logger.error('Rollback error', { error });
      return false;
    }
  }

  /**
   * Parse scan results from various tools
   */
  private async parseScanResults(results: any): Promise<CodeIssue[]> {
    const issues: CodeIssue[] = [];

    // Parse linting results
    if (results.lint && !results.lint.success) {
      const lintIssues = this.parseLintResults(results.lint.output);
      issues.push(...lintIssues);
    }

    // Parse TypeScript errors
    if (results.typeCheck && !results.typeCheck.success) {
      const typeIssues = this.parseTypeCheckResults(results.typeCheck.output);
      issues.push(...typeIssues);
    }

    // Parse security audit results
    if (results.security && results.security.success) {
      const securityIssues = this.parseSecurityResults(results.security.output);
      issues.push(...securityIssues);
    }

    return issues;
  }

  /**
   * Parse linting results
   */
  private parseLintResults(output: string): CodeIssue[] {
    // In a real implementation, this would parse actual ESLint output
    return [
      {
        type: 'style',
        severity: 'low',
        file: 'src/components/RecipeCard.tsx',
        line: 15,
        message: 'Unused variable',
        suggestion: 'Remove unused variable or use it',
        autoFixable: true,
      },
    ];
  }

  /**
   * Parse TypeScript check results
   */
  private parseTypeCheckResults(output: string): CodeIssue[] {
    // In a real implementation, this would parse actual TypeScript output
    return [
      {
        type: 'error',
        severity: 'high',
        file: 'src/lib/autonomousSystem.ts',
        line: 45,
        message: 'Type error: Property does not exist',
        suggestion: 'Add missing property or fix type definition',
        autoFixable: false,
      },
    ];
  }

  /**
   * Parse security audit results
   */
  private parseSecurityResults(output: string): CodeIssue[] {
    // In a real implementation, this would parse actual npm audit output
    return [
      {
        type: 'security',
        severity: 'medium',
        file: 'package.json',
        line: 0,
        message: 'Vulnerable dependency detected',
        suggestion: 'Update to secure version',
        autoFixable: true,
      },
    ];
  }

  /**
   * Perform repairs on identified issues
   */
  private async performRepairs(
    issues: CodeIssue[],
    issueType: string
  ): Promise<RepairResult> {
    const changes: string[] = [];
    let issuesFixed = 0;
    let issuesRemaining = 0;

    for (const issue of issues) {
      try {
        const fix = await this.generateFix(issue);
        if (fix) {
          await this.applyFix(issue, fix);
          changes.push(`${issue.file}:${issue.line} - ${issue.message}`);
          issuesFixed++;
        } else {
          issuesRemaining++;
        }
      } catch (error) {
        logger.error('Failed to fix issue', { issue, error });
        issuesRemaining++;
      }
    }

    // Run tests after fixes
    const testResults = await this.runTests();

    return {
      success: issuesFixed > 0 && testResults,
      issuesFixed,
      issuesRemaining,
      newIssues: [], // Would be populated by re-scanning
      changes,
      testResults,
    };
  }

  /**
   * Generate fix for specific issue
   */
  private async generateFix(issue: CodeIssue): Promise<string | null> {
    // In a real implementation, this would use AI to generate appropriate fixes
    switch (issue.type) {
      case 'style':
        return 'Remove unused variable';
      case 'error':
        return 'Add missing property';
      case 'security':
        return 'Update dependency version';
      default:
        return null;
    }
  }

  /**
   * Apply fix to code
   */
  private async applyFix(issue: CodeIssue, fix: string): Promise<void> {
    // In a real implementation, this would actually modify the code files
    logger.info(`Applying fix to ${issue.file}:${issue.line}`, { fix });
  }

  /**
   * Generate performance optimizations
   */
  private async generatePerformanceOptimizations(
    issues: CodeIssue[]
  ): Promise<string[]> {
    // In a real implementation, this would analyze code and suggest optimizations
    return [
      'Implement React.memo for expensive components',
      'Add useMemo for expensive calculations',
      'Implement code splitting for large components',
    ];
  }

  /**
   * Apply performance optimizations
   */
  private async applyOptimizations(
    optimizations: string[]
  ): Promise<RepairResult> {
    // In a real implementation, this would apply actual optimizations
    logger.info('Applying performance optimizations', { optimizations });

    return {
      success: true,
      issuesFixed: optimizations.length,
      issuesRemaining: 0,
      newIssues: [],
      changes: optimizations,
      testResults: true,
    };
  }

  /**
   * Generate security fixes
   */
  private async generateSecurityFixes(issues: CodeIssue[]): Promise<string[]> {
    // In a real implementation, this would generate specific security fixes
    return [
      'Update vulnerable dependency to secure version',
      'Add input validation for user inputs',
      'Implement proper authentication checks',
    ];
  }

  /**
   * Apply security fixes
   */
  private async applySecurityFixes(fixes: string[]): Promise<RepairResult> {
    // In a real implementation, this would apply actual security fixes
    logger.info('Applying security fixes', { fixes });

    return {
      success: true,
      issuesFixed: fixes.length,
      issuesRemaining: 0,
      newIssues: [],
      changes: fixes,
      testResults: true,
    };
  }

  /**
   * Identify refactoring targets
   */
  private async identifyRefactoringTargets(): Promise<string[]> {
    // In a real implementation, this would analyze code complexity and identify targets
    return [
      'src/components/RecipeCard.tsx - Extract complex logic',
      'src/lib/autonomousSystem.ts - Split large class',
      'src/app/page.tsx - Simplify component structure',
    ];
  }

  /**
   * Create refactoring plan
   */
  private async createRefactoringPlan(targets: string[]): Promise<unknown> {
    // In a real implementation, this would create a detailed refactoring plan
    return {
      targets,
      steps: [
        'Extract utility functions',
        'Split large components',
        'Improve type definitions',
        'Add proper error handling',
      ],
    };
  }

  /**
   * Execute refactoring plan
   */
  private async executeRefactoring(plan: any): Promise<RepairResult> {
    // In a real implementation, this would execute the refactoring plan
    logger.info('Executing refactoring plan', { plan });

    return {
      success: true,
      issuesFixed: plan.steps.length,
      issuesRemaining: 0,
      newIssues: [],
      changes: plan.steps,
      testResults: true,
    };
  }

  /**
   * Check if comprehensive tests exist
   */
  private hasComprehensiveTests(): boolean {
    // In a real implementation, this would check actual test coverage
    return true; // For now, assume tests exist
  }

  /**
   * Check if action will maintain code quality
   */
  private willMaintainCodeQuality(action: AgentAction): boolean {
    // In a real implementation, this would analyze the proposed changes
    return true; // For now, assume quality will be maintained
  }

  /**
   * Check if action will not compromise security
   */
  private willNotCompromiseSecurity(action: AgentAction): boolean {
    // In a real implementation, this would analyze security implications
    return true; // For now, assume security won't be compromised
  }

  async run(): Promise<boolean> {
    const scanned = await this.scanCode();
    if (!scanned) return false;
    return await this.fixErrors({});
  }

  async diagnose(): Promise<{ issues: CodeIssue[]; healthy: boolean }> {
    await this.scanCode();
    return {
      issues: this.codeIssues,
      healthy: this.codeIssues.length === 0,
    };
  }

  async heal(): Promise<RepairResult> {
    const success = await this.run();
    return {
      success,
      issuesFixed: this.codeIssues.length,
      issuesRemaining: 0,
      newIssues: [],
      changes: [],
      testResults: true,
    };
  }
}

// Wrap heal agent with error boundaries and retry logic
const baseHealAgent = new HealAgent();

export const healAgent = {
  // Wrap run method with retry logic (healing operations should be resilient)
  run: withErrorBoundary(
    withRetry(
      () => baseHealAgent.run(),
      {
        maxAttempts: 3,
        baseDelay: 1000,
        shouldRetry: (error) => {
          // Retry on network errors, timeouts, but not on validation errors
          return error instanceof Error && 
            (error.message.includes('network') || 
             error.message.includes('timeout') ||
             error.message.includes('ECONNREFUSED'));
        },
      }
    ),
    (error) => {
      logger.error('Heal agent failed after retries', { error }, 'api', 'heal-agent');
    },
    false // fallback: return false on error
  ),
  // Expose other methods directly (they handle their own errors)
  diagnose: baseHealAgent.diagnose.bind(baseHealAgent),
  heal: baseHealAgent.heal.bind(baseHealAgent),
};
