import { createClient } from '@supabase/supabase-js';
import { logger } from './logger';
import { analytics } from './analytics';

interface SecurityCheck {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pass' | 'fail' | 'warning' | 'error';
  details: any;
  timestamp: string;
  remediation?: string;
}

interface ComplianceReport {
  timestamp: string;
  overallScore: number;
  status: 'compliant' | 'non-compliant' | 'needs-attention';
  checks: SecurityCheck[];
  recommendations: string[];
  nextAudit: string;
}

class SecurityValidator {
  private supabase: any;
  private checks: SecurityCheck[] = [];

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
    );
  }

  async runAllSecurityChecks(): Promise<ComplianceReport> {
    
    this.checks = [];

    // Run all security checks
    await this.checkDependencies();
    await this.checkSecrets();
    await this.checkInputValidation();
    await this.checkOutputSanitization();
    await this.checkAuthentication();
    await this.checkAuthorization();
    await this.checkDataEncryption();
    await this.checkLoggingSecurity();
    await this.checkNetworkSecurity();
    await this.checkAISafety();
    await this.checkComplianceStandards();

    // Calculate overall score
    const overallScore = this.calculateOverallScore();
    const status = this.determineComplianceStatus(overallScore);
    const recommendations = this.generateRecommendations();

    const report: ComplianceReport = {
      timestamp: new Date().toISOString(),
      overallScore,
      status,
      checks: this.checks,
      recommendations,
      nextAudit: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    // Log the security report
    await this.logSecurityReport(report);

    return report;
  }

  private async checkDependencies(): Promise<void> {
    const checkId = 'dependencies';

    try {
      // Check for known vulnerabilities
      const { execSync } = require('child_process');
      const auditOutput = execSync('npm audit --json', { encoding: 'utf8' });
      const auditData = JSON.parse(auditOutput);

      const vulnerabilities = auditData.metadata?.vulnerabilities || {};
      const criticalCount = vulnerabilities.critical || 0;
      const highCount = vulnerabilities.high || 0;
      const moderateCount = vulnerabilities.moderate || 0;

      let status: 'pass' | 'fail' | 'warning' = 'pass';
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';

      if (criticalCount > 0) {
        status = 'fail';
        severity = 'critical';
      } else if (highCount > 0) {
        status = 'fail';
        severity = 'high';
      } else if (moderateCount > 0) {
        status = 'warning';
        severity = 'medium';
      }

      this.checks.push({
        id: checkId,
        name: 'Dependency Vulnerability Scan',
        description: 'Check for known security vulnerabilities in dependencies',
        severity,
        status,
        details: {
          critical: criticalCount,
          high: highCount,
          moderate: moderateCount,
          low: vulnerabilities.low || 0,
          total: Object.values(vulnerabilities).reduce(
            (a: number, b: number) => a + b,
            0
          ),
        },
        timestamp: new Date().toISOString(),
        remediation:
          criticalCount > 0 || highCount > 0
            ? 'Run "npm audit fix" to resolve vulnerabilities'
            : undefined,
      });
    } catch (error) {
      this.checks.push({
        id: checkId,
        name: 'Dependency Vulnerability Scan',
        description: 'Check for known security vulnerabilities in dependencies',
        severity: 'high',
        status: 'error',
        details: { error: error.message },
        timestamp: new Date().toISOString(),
      });
    }
  }

  private async checkSecrets(): Promise<void> {
    const checkId = 'secrets';

    try {
      // Check for hardcoded secrets
      const { execSync } = require('child_process');
      const trufflehogOutput = execSync(
        'trufflehog filesystem . --no-verification --format json',
        {
          encoding: 'utf8',
          cwd: process.cwd(),
        }
      );

      const secrets = JSON.parse(trufflehogOutput);
      const secretCount = secrets.length;

      let status: 'pass' | 'fail' | 'warning' = 'pass';
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';

      if (secretCount > 0) {
        status = 'fail';
        severity = 'critical';
      }

      this.checks.push({
        id: checkId,
        name: 'Secrets Detection',
        description: 'Scan for hardcoded secrets and credentials',
        severity,
        status,
        details: {
          secretsFound: secretCount,
          secrets: secrets.map((s: any) => ({
            file: s.SourceMetadata?.Data?.Filesystem?.file,
            line: s.SourceMetadata?.Data?.Filesystem?.line,
            detector: s.DetectorName,
          })),
        },
        timestamp: new Date().toISOString(),
        remediation:
          secretCount > 0
            ? 'Remove hardcoded secrets and use environment variables or secret management'
            : undefined,
      });
    } catch (error) {
      this.checks.push({
        id: checkId,
        name: 'Secrets Detection',
        description: 'Scan for hardcoded secrets and credentials',
        severity: 'medium',
        status: 'error',
        details: { error: error.message },
        timestamp: new Date().toISOString(),
      });
    }
  }

  private async checkInputValidation(): Promise<void> {
    const checkId = 'input_validation';

    try {
      // Check if input validation is properly implemented
      const fs = require('fs');
      const path = require('path');

      const srcDir = path.join(process.cwd(), 'src');
      const files = this.getAllFiles(srcDir, ['.ts', '.tsx', '.js', '.jsx']);

      let validationCount = 0;
      let totalInputs = 0;

      for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');

        // Count input validation patterns
        const validationPatterns = [
          /zod\./g,
          /yup\./g,
          /joi\./g,
          /validateInput/g,
          /sanitizeInput/g,
          /escapeHtml/g,
        ];

        for (const pattern of validationPatterns) {
          validationCount += (content.match(pattern) || []).length;
        }

        // Count input handling
        const inputPatterns = [
          /req\.body/g,
          /req\.query/g,
          /req\.params/g,
          /useState/g,
          /useForm/g,
        ];

        for (const pattern of inputPatterns) {
          totalInputs += (content.match(pattern) || []).length;
        }
      }

      const validationRatio =
        totalInputs > 0 ? validationCount / totalInputs : 0;

      let status: 'pass' | 'fail' | 'warning' = 'pass';
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';

      if (validationRatio < 0.3) {
        status = 'fail';
        severity = 'high';
      } else if (validationRatio < 0.6) {
        status = 'warning';
        severity = 'medium';
      }

      this.checks.push({
        id: checkId,
        name: 'Input Validation',
        description: 'Check for proper input validation implementation',
        severity,
        status,
        details: {
          validationCount,
          totalInputs,
          validationRatio: Math.round(validationRatio * 100) / 100,
        },
        timestamp: new Date().toISOString(),
        remediation:
          validationRatio < 0.6
            ? 'Implement comprehensive input validation using Zod or similar libraries'
            : undefined,
      });
    } catch (error) {
      this.checks.push({
        id: checkId,
        name: 'Input Validation',
        description: 'Check for proper input validation implementation',
        severity: 'medium',
        status: 'error',
        details: { error: error.message },
        timestamp: new Date().toISOString(),
      });
    }
  }

  private async checkOutputSanitization(): Promise<void> {
    const checkId = 'output_sanitization';

    try {
      // Check for output sanitization patterns
      const fs = require('fs');
      const path = require('path');

      const srcDir = path.join(process.cwd(), 'src');
      const files = this.getAllFiles(srcDir, ['.ts', '.tsx', '.js', '.jsx']);

      let sanitizationCount = 0;
      let totalOutputs = 0;

      for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');

        // Count sanitization patterns
        const sanitizationPatterns = [
          /sanitize/g,
          /escape/g,
          /clean/g,
          /purify/g,
          /dompurify/g,
          /xss/g,
        ];

        for (const pattern of sanitizationPatterns) {
          sanitizationCount += (content.match(pattern) || []).length;
        }

        // Count output patterns
        const outputPatterns = [
          /dangerouslySetInnerHTML/g,
          /innerHTML/g,
          /document\.write/g,
          /eval\(/g,
        ];

        for (const pattern of outputPatterns) {
          totalOutputs += (content.match(pattern) || []).length;
        }
      }

      const sanitizationRatio =
        totalOutputs > 0 ? sanitizationCount / totalOutputs : 1;

      let status: 'pass' | 'fail' | 'warning' = 'pass';
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';

      if (sanitizationRatio < 0.5) {
        status = 'fail';
        severity = 'high';
      } else if (sanitizationRatio < 0.8) {
        status = 'warning';
        severity = 'medium';
      }

      this.checks.push({
        id: checkId,
        name: 'Output Sanitization',
        description: 'Check for proper output sanitization implementation',
        severity,
        status,
        details: {
          sanitizationCount,
          totalOutputs,
          sanitizationRatio: Math.round(sanitizationRatio * 100) / 100,
        },
        timestamp: new Date().toISOString(),
        remediation:
          sanitizationRatio < 0.8
            ? 'Implement comprehensive output sanitization to prevent XSS attacks'
            : undefined,
      });
    } catch (error) {
      this.checks.push({
        id: checkId,
        name: 'Output Sanitization',
        description: 'Check for proper output sanitization implementation',
        severity: 'medium',
        status: 'error',
        details: { error: error.message },
        timestamp: new Date().toISOString(),
      });
    }
  }

  private async checkAuthentication(): Promise<void> {
    const checkId = 'authentication';

    try {
      // Check for authentication implementation
      const fs = require('fs');
      const path = require('path');

      const srcDir = path.join(process.cwd(), 'src');
      const files = this.getAllFiles(srcDir, ['.ts', '.tsx', '.js', '.jsx']);

      let authPatterns = 0;
      let totalFiles = files.length;

      for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');

        // Count authentication patterns
        const patterns = [
          /auth/g,
          /login/g,
          /logout/g,
          /session/g,
          /jwt/g,
          /token/g,
          /password/g,
          /bcrypt/g,
          /hash/g,
        ];

        for (const pattern of patterns) {
          if (pattern.test(content)) {
            authPatterns++;
            break;
          }
        }
      }

      const authRatio = totalFiles > 0 ? authPatterns / totalFiles : 0;

      let status: 'pass' | 'fail' | 'warning' = 'pass';
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';

      if (authRatio < 0.1) {
        status = 'fail';
        severity = 'high';
      } else if (authRatio < 0.3) {
        status = 'warning';
        severity = 'medium';
      }

      this.checks.push({
        id: checkId,
        name: 'Authentication',
        description: 'Check for authentication implementation',
        severity,
        status,
        details: {
          authPatterns,
          totalFiles,
          authRatio: Math.round(authRatio * 100) / 100,
        },
        timestamp: new Date().toISOString(),
        remediation:
          authRatio < 0.3
            ? 'Implement proper authentication mechanisms'
            : undefined,
      });
    } catch (error) {
      this.checks.push({
        id: checkId,
        name: 'Authentication',
        description: 'Check for authentication implementation',
        severity: 'medium',
        status: 'error',
        details: { error: error.message },
        timestamp: new Date().toISOString(),
      });
    }
  }

  private async checkAuthorization(): Promise<void> {
    const checkId = 'authorization';

    try {
      // Check for authorization implementation
      const fs = require('fs');
      const path = require('path');

      const srcDir = path.join(process.cwd(), 'src');
      const files = this.getAllFiles(srcDir, ['.ts', '.tsx', '.js', '.jsx']);

      let authzPatterns = 0;
      let totalFiles = files.length;

      for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');

        // Count authorization patterns
        const patterns = [
          /authorize/g,
          /permission/g,
          /role/g,
          /access/g,
          /middleware/g,
          /guard/g,
          /canActivate/g,
          /isAuthorized/g,
        ];

        for (const pattern of patterns) {
          if (pattern.test(content)) {
            authzPatterns++;
            break;
          }
        }
      }

      const authzRatio = totalFiles > 0 ? authzPatterns / totalFiles : 0;

      let status: 'pass' | 'fail' | 'warning' = 'pass';
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';

      if (authzRatio < 0.1) {
        status = 'fail';
        severity = 'high';
      } else if (authzRatio < 0.3) {
        status = 'warning';
        severity = 'medium';
      }

      this.checks.push({
        id: checkId,
        name: 'Authorization',
        description: 'Check for authorization implementation',
        severity,
        status,
        details: {
          authzPatterns,
          totalFiles,
          authzRatio: Math.round(authzRatio * 100) / 100,
        },
        timestamp: new Date().toISOString(),
        remediation:
          authzRatio < 0.3
            ? 'Implement proper authorization mechanisms'
            : undefined,
      });
    } catch (error) {
      this.checks.push({
        id: checkId,
        name: 'Authorization',
        description: 'Check for authorization implementation',
        severity: 'medium',
        status: 'error',
        details: { error: error.message },
        timestamp: new Date().toISOString(),
      });
    }
  }

  private async checkDataEncryption(): Promise<void> {
    const checkId = 'data_encryption';

    try {
      // Check for data encryption implementation
      const fs = require('fs');
      const path = require('path');

      const srcDir = path.join(process.cwd(), 'src');
      const files = this.getAllFiles(srcDir, ['.ts', '.tsx', '.js', '.jsx']);

      let encryptionPatterns = 0;
      let totalFiles = files.length;

      for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');

        // Count encryption patterns
        const patterns = [
          /encrypt/g,
          /decrypt/g,
          /cipher/g,
          /hash/g,
          /bcrypt/g,
          /crypto/g,
          /aes/g,
          /rsa/g,
        ];

        for (const pattern of patterns) {
          if (pattern.test(content)) {
            encryptionPatterns++;
            break;
          }
        }
      }

      const encryptionRatio =
        totalFiles > 0 ? encryptionPatterns / totalFiles : 0;

      let status: 'pass' | 'fail' | 'warning' = 'pass';
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';

      if (encryptionRatio < 0.1) {
        status = 'fail';
        severity = 'high';
      } else if (encryptionRatio < 0.3) {
        status = 'warning';
        severity = 'medium';
      }

      this.checks.push({
        id: checkId,
        name: 'Data Encryption',
        description: 'Check for data encryption implementation',
        severity,
        status,
        details: {
          encryptionPatterns,
          totalFiles,
          encryptionRatio: Math.round(encryptionRatio * 100) / 100,
        },
        timestamp: new Date().toISOString(),
        remediation:
          encryptionRatio < 0.3
            ? 'Implement proper data encryption for sensitive information'
            : undefined,
      });
    } catch (error) {
      this.checks.push({
        id: checkId,
        name: 'Data Encryption',
        description: 'Check for data encryption implementation',
        severity: 'medium',
        status: 'error',
        details: { error: error.message },
        timestamp: new Date().toISOString(),
      });
    }
  }

  private async checkLoggingSecurity(): Promise<void> {
    const checkId = 'logging_security';

    try {
      // Check for secure logging practices
      const fs = require('fs');
      const path = require('path');

      const srcDir = path.join(process.cwd(), 'src');
      const files = this.getAllFiles(srcDir, ['.ts', '.tsx', '.js', '.jsx']);

      let secureLoggingPatterns = 0;
      let totalLoggingPatterns = 0;

      for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');

        // Count secure logging patterns
        const securePatterns = [
          /redact/g,
          /mask/g,
          /sanitize/g,
          /filter/g,
          /removeSensitiveData/g,
        ];

        for (const pattern of securePatterns) {
          secureLoggingPatterns += (content.match(pattern) || []).length;
        }

        // Count all logging patterns
        const allLoggingPatterns = [
          /console\.log/g,
          /console\.error/g,
          /console\.warn/g,
          /logger\./g,
          /log\./g,
        ];

        for (const pattern of allLoggingPatterns) {
          totalLoggingPatterns += (content.match(pattern) || []).length;
        }
      }

      const secureLoggingRatio =
        totalLoggingPatterns > 0
          ? secureLoggingPatterns / totalLoggingPatterns
          : 1;

      let status: 'pass' | 'fail' | 'warning' = 'pass';
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';

      if (secureLoggingRatio < 0.3) {
        status = 'fail';
        severity = 'high';
      } else if (secureLoggingRatio < 0.6) {
        status = 'warning';
        severity = 'medium';
      }

      this.checks.push({
        id: checkId,
        name: 'Logging Security',
        description: 'Check for secure logging practices',
        severity,
        status,
        details: {
          secureLoggingPatterns,
          totalLoggingPatterns,
          secureLoggingRatio: Math.round(secureLoggingRatio * 100) / 100,
        },
        timestamp: new Date().toISOString(),
        remediation:
          secureLoggingRatio < 0.6
            ? 'Implement secure logging practices to prevent sensitive data exposure'
            : undefined,
      });
    } catch (error) {
      this.checks.push({
        id: checkId,
        name: 'Logging Security',
        description: 'Check for secure logging practices',
        severity: 'medium',
        status: 'error',
        details: { error: error.message },
        timestamp: new Date().toISOString(),
      });
    }
  }

  private async checkNetworkSecurity(): Promise<void> {
    const checkId = 'network_security';

    try {
      // Check for network security implementation
      const fs = require('fs');
      const path = require('path');

      const srcDir = path.join(process.cwd(), 'src');
      const files = this.getAllFiles(srcDir, ['.ts', '.tsx', '.js', '.jsx']);

      let networkSecurityPatterns = 0;
      let totalFiles = files.length;

      for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');

        // Count network security patterns
        const patterns = [
          /https/g,
          /ssl/g,
          /tls/g,
          /cors/g,
          /csp/g,
          /helmet/g,
          /rateLimit/g,
          /throttle/g,
        ];

        for (const pattern of patterns) {
          if (pattern.test(content)) {
            networkSecurityPatterns++;
            break;
          }
        }
      }

      const networkSecurityRatio =
        totalFiles > 0 ? networkSecurityPatterns / totalFiles : 0;

      let status: 'pass' | 'fail' | 'warning' = 'pass';
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';

      if (networkSecurityRatio < 0.1) {
        status = 'fail';
        severity = 'high';
      } else if (networkSecurityRatio < 0.3) {
        status = 'warning';
        severity = 'medium';
      }

      this.checks.push({
        id: checkId,
        name: 'Network Security',
        description: 'Check for network security implementation',
        severity,
        status,
        details: {
          networkSecurityPatterns,
          totalFiles,
          networkSecurityRatio: Math.round(networkSecurityRatio * 100) / 100,
        },
        timestamp: new Date().toISOString(),
        remediation:
          networkSecurityRatio < 0.3
            ? 'Implement network security measures like HTTPS, CORS, and rate limiting'
            : undefined,
      });
    } catch (error) {
      this.checks.push({
        id: checkId,
        name: 'Network Security',
        description: 'Check for network security implementation',
        severity: 'medium',
        status: 'error',
        details: { error: error.message },
        timestamp: new Date().toISOString(),
      });
    }
  }

  private async checkAISafety(): Promise<void> {
    const checkId = 'ai_safety';

    try {
      // Check for AI safety implementation
      const fs = require('fs');
      const path = require('path');

      const srcDir = path.join(process.cwd(), 'src');
      const files = this.getAllFiles(srcDir, ['.ts', '.tsx', '.js', '.jsx']);

      let aiSafetyPatterns = 0;
      let totalFiles = files.length;

      for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');

        // Count AI safety patterns
        const patterns = [
          /aiSafety/g,
          /promptInjection/g,
          /guardrails/g,
          /validateInput/g,
          /sanitizeInput/g,
          /contentFilter/g,
          /safetyCheck/g,
        ];

        for (const pattern of patterns) {
          if (pattern.test(content)) {
            aiSafetyPatterns++;
            break;
          }
        }
      }

      const aiSafetyRatio = totalFiles > 0 ? aiSafetyPatterns / totalFiles : 0;

      let status: 'pass' | 'fail' | 'warning' = 'pass';
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';

      if (aiSafetyRatio < 0.1) {
        status = 'fail';
        severity = 'high';
      } else if (aiSafetyRatio < 0.3) {
        status = 'warning';
        severity = 'medium';
      }

      this.checks.push({
        id: checkId,
        name: 'AI Safety',
        description: 'Check for AI safety implementation',
        severity,
        status,
        details: {
          aiSafetyPatterns,
          totalFiles,
          aiSafetyRatio: Math.round(aiSafetyRatio * 100) / 100,
        },
        timestamp: new Date().toISOString(),
        remediation:
          aiSafetyRatio < 0.3
            ? 'Implement AI safety measures like prompt injection protection and content filtering'
            : undefined,
      });
    } catch (error) {
      this.checks.push({
        id: checkId,
        name: 'AI Safety',
        description: 'Check for AI safety implementation',
        severity: 'medium',
        status: 'error',
        details: { error: error.message },
        timestamp: new Date().toISOString(),
      });
    }
  }

  private async checkComplianceStandards(): Promise<void> {
    const checkId = 'compliance_standards';

    try {
      // Check for compliance standards implementation
      const fs = require('fs');
      const path = require('path');

      const srcDir = path.join(process.cwd(), 'src');
      const files = this.getAllFiles(srcDir, ['.ts', '.tsx', '.js', '.jsx']);

      let compliancePatterns = 0;
      let totalFiles = files.length;

      for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');

        // Count compliance patterns
        const patterns = [
          /gdpr/g,
          /ccpa/g,
          /hipaa/g,
          /sox/g,
          /pci/g,
          /iso27001/g,
          /compliance/g,
          /audit/g,
        ];

        for (const pattern of patterns) {
          if (pattern.test(content)) {
            compliancePatterns++;
            break;
          }
        }
      }

      const complianceRatio =
        totalFiles > 0 ? compliancePatterns / totalFiles : 0;

      let status: 'pass' | 'fail' | 'warning' = 'pass';
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';

      if (complianceRatio < 0.1) {
        status = 'fail';
        severity = 'high';
      } else if (complianceRatio < 0.3) {
        status = 'warning';
        severity = 'medium';
      }

      this.checks.push({
        id: checkId,
        name: 'Compliance Standards',
        description: 'Check for compliance standards implementation',
        severity,
        status,
        details: {
          compliancePatterns,
          totalFiles,
          complianceRatio: Math.round(complianceRatio * 100) / 100,
        },
        timestamp: new Date().toISOString(),
        remediation:
          complianceRatio < 0.3
            ? 'Implement compliance standards like GDPR, CCPA, and HIPAA'
            : undefined,
      });
    } catch (error) {
      this.checks.push({
        id: checkId,
        name: 'Compliance Standards',
        description: 'Check for compliance standards implementation',
        severity: 'medium',
        status: 'error',
        details: { error: error.message },
        timestamp: new Date().toISOString(),
      });
    }
  }

  private getAllFiles(dir: string, extensions: string[]): string[] {
    const fs = require('fs');
    const path = require('path');

    let files: string[] = [];
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        files = files.concat(this.getAllFiles(fullPath, extensions));
      } else if (extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }

    return files;
  }

  private calculateOverallScore(): number {
    if (this.checks.length === 0) return 0;

    let totalScore = 0;
    let totalWeight = 0;

    for (const check of this.checks) {
      let weight = 1;
      let score = 0;

      // Weight by severity
      switch (check.severity) {
        case 'critical':
          weight = 4;
          break;
        case 'high':
          weight = 3;
          break;
        case 'medium':
          weight = 2;
          break;
        case 'low':
          weight = 1;
          break;
      }

      // Score by status
      switch (check.status) {
        case 'pass':
          score = 100;
          break;
        case 'warning':
          score = 70;
          break;
        case 'fail':
          score = 30;
          break;
        case 'error':
          score = 0;
          break;
      }

      totalScore += score * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  }

  private determineComplianceStatus(
    score: number
  ): 'compliant' | 'non-compliant' | 'needs-attention' {
    if (score >= 90) return 'compliant';
    if (score >= 70) return 'needs-attention';
    return 'non-compliant';
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    for (const check of this.checks) {
      if (check.status === 'fail' || check.status === 'warning') {
        if (check.remediation) {
          recommendations.push(check.remediation);
        }
      }
    }

    // Add general recommendations
    if (recommendations.length === 0) {
      recommendations.push('Continue monitoring security practices');
      recommendations.push('Regular security audits recommended');
    }

    return recommendations;
  }

  private async logSecurityReport(report: ComplianceReport): Promise<void> {
    try {
      await logger.info(
        'Security validation completed',
        {
          overallScore: report.overallScore,
          status: report.status,
          checksCount: report.checks.length,
          failedChecks: report.checks.filter(c => c.status === 'fail').length,
          warningChecks: report.checks.filter(c => c.status === 'warning')
            .length,
        },
        'security',
        'validation'
      );

      await analytics.trackEvent('security_validation', {
        overall_score: report.overallScore,
        status: report.status,
        checks_count: report.checks.length,
        failed_checks: report.checks.filter(c => c.status === 'fail').length,
      });
    } catch (error) {
      // Error handled: Failed to log security report:
    }
  }
}

export const securityValidator = new SecurityValidator();
