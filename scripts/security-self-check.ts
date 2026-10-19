#!/usr/bin/env ts-node
/**
 * Security Self-Check Script — Hardonia
 * Comprehensive 360° security, privacy, accessibility, and compliance validation
 * 
 * Stakeholder Lenses:
 * - Privacy Steward: GDPR, data protection, consent management
 * - Accessibility Champion: WCAG 2.2 AA compliance
 * - Growth Architect: Analytics, conversion optimization
 * - SRE/Resilience Engineer: Monitoring, health checks, resilience
 * - AppSec/Threat Model Architect: Security headers, CSP, secrets, dependencies
 * - Compliance Sentinel: RLS, audit trails, data governance
 * - AI Systems Auditor: AI usage, explainability, cost controls
 * - Innovation Catalyst: Architecture quality, performance budgets
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { globSync } from "glob";
import { secretsManager } from './secrets-manager-unified.mjs';
import { createComponentLogger } from '@whats-for-dinner/utils';

const logger = createComponentLogger('security-self-check-ts');
interface CheckResult {
  lens: string;
  category: string;
  check: string;
  passed: boolean;
  severity: "critical" | "warning" | "info";
  message: string;
  remediation?: string;
}

interface SecurityReport {
  timestamp: string;
  passed: number;
  failed: number;
  warnings: number;
  results: CheckResult[];
  criticalFailures: CheckResult[];
}

const results: CheckResult[] = [];
let exitCode = 0;

// ============================================================================
// Utility Functions
// ============================================================================

function log(message: string, type: "info" | "success" | "warning" | "error" = "info") {
  const icons = { info: "ℹ️", success: "✅", warning: "⚠️", error: "❌" };
  logger.info(`${icons[type]} ${message}`);
}

function recordCheck(
  lens: string,
  category: string,
  check: string,
  passed: boolean,
  severity: "critical" | "warning" | "info",
  message: string,
  remediation?: string
) {
  results.push({ lens, category, check, passed, severity, message, remediation });
  if (!passed && severity === "critical") {
    exitCode = 1;
  }
}

function runCmd(cmd: string, silent = false): { success: boolean; output: string } {
  try {
    const output = execSync(cmd, { stdio: silent ? "pipe" : "inherit", encoding: "utf-8" });
    return { success: true, output: output.toString() };
  } catch (e: any) {
    return { success: false, output: e.message || String(e) };
  }
}

function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

function fileContains(filePath: string, pattern: string | RegExp): boolean {
  if (!fileExists(filePath)) return false;
  const content = fs.readFileSync(filePath, "utf8");
  if (typeof pattern === "string") {
    return content.includes(pattern);
  }
  return pattern.test(content);
}

function readJsonFile(filePath: string): unknown {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

// ============================================================================
// Privacy Steward Checks
// ============================================================================

function checkPrivacyCompliance() {
  log("\n🔒 Privacy Steward Checks", "info");
  
  // Check privacy-related environment variables
  const privacyVars = [
    "PRIVACY_OFFICER_EMAIL",
    "DSAR_VERIFICATION_JWT_SECRET",
    "ARTIFACTS_BUCKET_URL",
    "MAGIC_LINK_BASE_URL",
  ];
  
  privacyVars.forEach((varName) => {
    const exists = !!process.env[varName];
    recordCheck(
      "Privacy Steward",
      "Environment Configuration",
      `Privacy var: ${varName}`,
      exists,
      exists ? "info" : "warning",
      exists ? `✅ ${varName} configured` : `⚠️ Missing ${varName}`,
      exists ? undefined : `Add ${varName} to your .env file`
    );
  });
  
  // Check for privacy migration files
  const privacyMigrations = globSync("**/migrations/**/*privacy*.sql", { cwd: process.cwd() });
  recordCheck(
    "Privacy Steward",
    "Database Schema",
    "Privacy migration files",
    privacyMigrations.length > 0,
    privacyMigrations.length > 0 ? "info" : "warning",
    privacyMigrations.length > 0
      ? `✅ Found ${privacyMigrations.length} privacy migration(s)`
      : "⚠️ No privacy migration files found",
    privacyMigrations.length === 0 ? "Create privacy migration with RLS policies" : undefined
  );
  
  // Check for GDPR compliance scripts
  const gdprScripts = [
    "scripts/privacy-compliance-check.ts",
    "scripts/privacy-gdpr.js",
    "scripts/demo-privacy.ts",
  ];
  const foundScripts = gdprScripts.filter((s) => fileExists(s));
  recordCheck(
    "Privacy Steward",
    "Privacy Tools",
    "GDPR compliance scripts",
    foundScripts.length > 0,
    foundScripts.length > 0 ? "info" : "warning",
    foundScripts.length > 0
      ? `✅ Found ${foundScripts.length} privacy script(s)`
      : "⚠️ No privacy compliance scripts found",
    foundScripts.length === 0 ? "Add privacy compliance checking scripts" : undefined
  );
  
  // Check for consent management
  const consentFiles = globSync("**/*consent*.{ts,tsx,js,jsx}", { cwd: process.cwd() });
  recordCheck(
    "Privacy Steward",
    "User Consent",
    "Consent management implementation",
    consentFiles.length > 0,
    "warning",
    consentFiles.length > 0
      ? `✅ Found ${consentFiles.length} consent-related file(s)`
      : "⚠️ No consent management files found",
    consentFiles.length === 0 ? "Implement consent management for GDPR compliance" : undefined
  );
}

// ============================================================================
// Accessibility Champion Checks
// ============================================================================

function checkAccessibility() {
  log("\n♿ Accessibility Champion Checks", "info");
  
  // Check for accessibility testing scripts
  const a11yScripts = ["scripts/a11y-test.js"];
  const hasA11yScript = a11yScripts.some((s) => fileExists(s));
  recordCheck(
    "Accessibility Champion",
    "Testing",
    "Accessibility test scripts",
    hasA11yScript,
    "warning",
    hasA11yScript ? "✅ Accessibility test script found" : "⚠️ No a11y test script found",
    hasA11yScript ? undefined : "Add accessibility testing with axe-core or pa11y"
  );
  
  // Check for ARIA attributes usage
  const componentFiles = globSync("**/*.{tsx,jsx}", {
    cwd: process.cwd(),
    ignore: ["**/node_modules/**", "**/.next/**", "**/dist/**"],
  });
  let ariaUsage = 0;
  componentFiles.slice(0, 10).forEach((file) => {
    if (fileContains(file, /aria-\w+/i)) ariaUsage++;
  });
  
  recordCheck(
    "Accessibility Champion",
    "Code Quality",
    "ARIA attributes usage",
    ariaUsage > 0,
    ariaUsage > 0 ? "info" : "warning",
    ariaUsage > 0 ? `✅ Found ARIA usage in ${ariaUsage} sample files` : "⚠️ Limited ARIA usage detected",
    ariaUsage === 0 ? "Ensure ARIA attributes are used for interactive elements" : undefined
  );
  
  // Check for alt text patterns in images
  const imageFiles = globSync("**/*.{tsx,jsx}", {
    cwd: process.cwd(),
    ignore: ["**/node_modules/**", "**/.next/**", "**/dist/**"],
  });
  let altTextUsage = 0;
  imageFiles.slice(0, 10).forEach((file) => {
    if (fileContains(file, /<img[^>]*alt=/i) || fileContains(file, /<Image[^>]*alt=/i)) {
      altTextUsage++;
    }
  });
  
  recordCheck(
    "Accessibility Champion",
    "Image Accessibility",
    "Alt text usage in images",
    altTextUsage > 0,
    "warning",
    altTextUsage > 0 ? `✅ Found alt text in ${altTextUsage} sample files` : "⚠️ Limited alt text usage",
    altTextUsage === 0 ? "Ensure all images have descriptive alt text" : undefined
  );
  
  // Check A11Y guide documentation
  recordCheck(
    "Accessibility Champion",
    "Documentation",
    "A11Y guide exists",
    fileExists("A11Y_GUIDE.md"),
    "info",
    fileExists("A11Y_GUIDE.md") ? "✅ A11Y guide found" : "⚠️ No A11Y guide found",
    fileExists("A11Y_GUIDE.md") ? undefined : "Create A11Y_GUIDE.md with WCAG 2.2 AA guidelines"
  );
}

// ============================================================================
// AppSec/Threat Model Architect Checks
// ============================================================================

function checkSecurityHeaders() {
  log("\n🔐 AppSec/Threat Model Architect Checks", "info");
  
  // Check Next.js config for security headers
  const nextConfigFiles = [
    "apps/web/next.config.ts",
    "apps/web/next.config.js",
    "next.config.ts",
    "next.config.js",
  ];
  const nextConfigFile = nextConfigFiles.find((f) => fileExists(f));
  
  if (nextConfigFile) {
    const hasSecurityHeaders = fileContains(nextConfigFile, /X-Frame-Options|X-Content-Type-Options|Content-Security-Policy/i);
    recordCheck(
      "AppSec",
      "Security Headers",
      "Security headers in Next.js config",
      hasSecurityHeaders,
      hasSecurityHeaders ? "info" : "warning",
      hasSecurityHeaders ? "✅ Security headers configured" : "⚠️ Security headers not found in Next.js config",
      hasSecurityHeaders ? undefined : "Add security headers to Next.js config (X-Frame-Options, CSP, etc.)"
    );
  }
  
  // Check for CSP in _headers file (Vercel)
  const headersFiles = ["public/_headers", ".vercel/_headers"];
  const headersFile = headersFiles.find((f) => fileExists(f));
  
  if (headersFile) {
    const hasCSP = fileContains(headersFile, /Content-Security-Policy/i);
    recordCheck(
      "AppSec",
      "Content Security Policy",
      "CSP in _headers file",
      hasCSP,
      hasCSP ? "info" : "critical",
      hasCSP ? "✅ CSP found in _headers" : "❌ No CSP found in _headers",
      hasCSP ? undefined : "Add strict CSP to /public/_headers file"
    );
  } else {
    recordCheck(
      "AppSec",
      "Content Security Policy",
      "CSP configuration file",
      false,
      "warning",
      "⚠️ No _headers file found (consider adding CSP)",
      "Create /public/_headers with Content-Security-Policy header"
    );
  }
  
  // Check for secrets scanning
  const secretsScript = fileExists("scripts/secrets-scan.mjs");
  recordCheck(
    "AppSec",
    "Secret Management",
    "Secrets scanning script",
    secretsScript,
    secretsScript ? "info" : "warning",
    secretsScript ? "✅ Secrets scanning script found" : "⚠️ No secrets scanning script",
    secretsScript ? undefined : "Add secrets scanning to prevent credential leaks"
  );
  
  // Check environment variables are not hardcoded
  const requiredEnvVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  ];
  
  requiredEnvVars.forEach((varName) => {
    const exists = !!process.env[varName];
    recordCheck(
      "AppSec",
      "Environment Configuration",
      `Required env var: ${varName}`,
      exists,
      exists ? "info" : "critical",
      exists ? `✅ ${varName} configured` : `❌ Missing ${varName}`,
      exists ? undefined : `Set ${varName} in environment variables`
    );
  });
  
  // Check for .env.example file
  recordCheck(
    "AppSec",
    "Configuration Management",
    ".env.example file exists",
    fileExists(".env.example"),
    "info",
    fileExists(".env.example") ? "✅ .env.example found" : "⚠️ No .env.example file",
    fileExists(".env.example") ? undefined : "Create .env.example with template values"
  );
  
  // Check for dependency vulnerabilities
  log("  Checking dependency vulnerabilities...", "info");
  const auditResult = runCmd("npm audit --audit-level=moderate --json", true);
  if (auditResult.success) {
    try {
      const auditData = JSON.parse(auditResult.output);
      const vulnerabilities = auditData?.metadata?.vulnerabilities || {};
      const critical = vulnerabilities.critical || 0;
      const high = vulnerabilities.high || 0;
      
      recordCheck(
        "AppSec",
        "Dependency Security",
        "No critical/high vulnerabilities",
        critical === 0 && high === 0,
        critical > 0 ? "critical" : high > 0 ? "warning" : "info",
        critical === 0 && high === 0
          ? "✅ No critical/high vulnerabilities"
          : `⚠️ Found ${critical} critical, ${high} high vulnerabilities`,
        critical > 0 || high > 0 ? "Run 'npm audit fix' to resolve vulnerabilities" : undefined
      );
    } catch {
      recordCheck(
        "AppSec",
        "Dependency Security",
        "Dependency audit",
        false,
        "warning",
        "⚠️ Could not parse audit results",
        "Run 'npm audit' manually to check dependencies"
      );
    }
  } else {
    recordCheck(
      "AppSec",
      "Dependency Security",
      "Dependency audit check",
      false,
      "warning",
      "⚠️ npm audit failed (may not be npm project)",
      "Check dependencies manually or use pnpm audit"
    );
  }
}

// ============================================================================
// Compliance Sentinel Checks (RLS, Audit Trails)
// ============================================================================

function checkCompliance() {
  log("\n📋 Compliance Sentinel Checks", "info");
  
  // Check for RLS smoke test script
  const rlsScript = fileExists("scripts/rls-smoke.ts");
  recordCheck(
    "Compliance Sentinel",
    "RLS Testing",
    "RLS smoke test script",
    rlsScript,
    rlsScript ? "info" : "warning",
    rlsScript ? "✅ RLS smoke test found" : "⚠️ No RLS smoke test script",
    rlsScript ? undefined : "Create RLS smoke test to validate row-level security"
  );
  
  // Check for Supabase migrations
  const migrationDirs = [
    "supabase/migrations",
    "apps/web/supabase/migrations",
    "whats-for-dinner/supabase/migrations",
  ];
  const migrationDir = migrationDirs.find((d) => fileExists(d));
  
  if (migrationDir) {
    const migrations = fs.readdirSync(migrationDir).filter((f) => f.endsWith(".sql"));
    recordCheck(
      "Compliance Sentinel",
      "Database Migrations",
      "Supabase migration files",
      migrations.length > 0,
      migrations.length > 0 ? "info" : "critical",
      migrations.length > 0
        ? `✅ Found ${migrations.length} migration(s)`
        : "❌ No migration files found",
      migrations.length === 0 ? "Create database migrations with RLS policies" : undefined
    );
    
    // Check for RLS in migrations
    let rlsMigrations = 0;
    migrations.forEach((migration) => {
      const content = fs.readFileSync(path.join(migrationDir, migration), "utf8");
      if (content.includes("ENABLE ROW LEVEL SECURITY") || content.includes("CREATE POLICY")) {
        rlsMigrations++;
      }
    });
    
    recordCheck(
      "Compliance Sentinel",
      "Row-Level Security",
      "Migrations with RLS policies",
      rlsMigrations > 0,
      rlsMigrations > 0 ? "info" : "critical",
      rlsMigrations > 0
        ? `✅ Found RLS in ${rlsMigrations} migration(s)`
        : "❌ No RLS policies found in migrations",
      rlsMigrations === 0 ? "Add RLS policies to all tables containing user data" : undefined
    );
  } else {
    recordCheck(
      "Compliance Sentinel",
      "Database Migrations",
      "Migration directory",
      false,
      "warning",
      "⚠️ No migration directory found",
      "Set up Supabase migrations directory"
    );
  }
  
  // Check for audit trail tables
  const auditMigrations = globSync("**/migrations/**/*audit*.sql", { cwd: process.cwd() });
  const hasAuditTables = auditMigrations.some((m) => {
    const content = fs.readFileSync(m, "utf8");
    return content.includes("audit") || content.includes("log");
  });
  
  recordCheck(
    "Compliance Sentinel",
    "Audit Trails",
    "Audit trail tables",
    hasAuditTables,
    "warning",
    hasAuditTables ? "✅ Audit trail tables found" : "⚠️ No audit trail tables found",
    hasAuditTables ? undefined : "Create audit trail tables for compliance logging"
  );
  
  // Check for compliance scripts
  const complianceScripts = [
    "scripts/compliance-check.ts",
    "scripts/privacy-compliance-check.ts",
  ];
  const foundCompliance = complianceScripts.filter((s) => fileExists(s));
  recordCheck(
    "Compliance Sentinel",
    "Compliance Tools",
    "Compliance checking scripts",
    foundCompliance.length > 0,
    foundCompliance.length > 0 ? "info" : "warning",
    foundCompliance.length > 0
      ? `✅ Found ${foundCompliance.length} compliance script(s)`
      : "⚠️ No compliance scripts found",
    foundCompliance.length === 0 ? "Add compliance checking scripts" : undefined
  );
}

// ============================================================================
// SRE/Resilience Engineer Checks
// ============================================================================

function checkResilience() {
  log("\n🛡️ SRE/Resilience Engineer Checks", "info");
  
  // Check for health check scripts
  const healthScript = fileExists("scripts/healthcheck.js");
  recordCheck(
    "SRE/Resilience",
    "Health Monitoring",
    "Health check script",
    healthScript,
    healthScript ? "info" : "warning",
    healthScript ? "✅ Health check script found" : "⚠️ No health check script",
    healthScript ? undefined : "Add health check endpoint for monitoring"
  );
  
  // Check for observability configuration
  const observabilityFiles = [
    "prometheus.yml",
    "grafana/",
    "loki-config.yml",
    "docker-compose.observability.yml",
  ];
  const foundObs = observabilityFiles.filter((f) => fileExists(f));
  recordCheck(
    "SRE/Resilience",
    "Observability",
    "Observability stack configuration",
    foundObs.length > 0,
    foundObs.length > 0 ? "info" : "warning",
    foundObs.length > 0
      ? `✅ Found ${foundObs.length} observability config(s)`
      : "⚠️ Limited observability configuration",
    foundObs.length === 0 ? "Set up Prometheus, Grafana, and Loki for monitoring" : undefined
  );
  
  // Check for alerting configuration
  const alertFiles = ["alerts.yml", "alertmanager.yml"];
  const hasAlerts = alertFiles.some((f) => fileExists(f));
  recordCheck(
    "SRE/Resilience",
    "Alerting",
    "Alert configuration files",
    hasAlerts,
    "warning",
    hasAlerts ? "✅ Alert configuration found" : "⚠️ No alert configuration",
    hasAlerts ? undefined : "Configure alerting with Alertmanager"
  );
  
  // Check for backup scripts
  const backupScripts = [
    "scripts/backup.js",
    "scripts/backups-dr.js",
    "scripts/clone-and-restore-check.ts",
  ];
  const foundBackups = backupScripts.filter((s) => fileExists(s));
  recordCheck(
    "SRE/Resilience",
    "Disaster Recovery",
    "Backup scripts",
    foundBackups.length > 0,
    foundBackups.length > 0 ? "info" : "warning",
    foundBackups.length > 0
      ? `✅ Found ${foundBackups.length} backup script(s)`
      : "⚠️ No backup scripts found",
    foundBackups.length === 0 ? "Implement backup and restore procedures" : undefined
  );
  
  // Check for chaos testing
  const chaosScripts = [
    "scripts/chaos-testing.js",
    "scripts/chaos-mini.ts",
  ];
  const hasChaos = chaosScripts.some((s) => fileExists(s));
  recordCheck(
    "SRE/Resilience",
    "Resilience Testing",
    "Chaos engineering scripts",
    hasChaos,
    "info",
    hasChaos ? "✅ Chaos testing scripts found" : "⚠️ No chaos testing",
    hasChaos ? undefined : "Consider adding chaos engineering tests"
  );
}

// ============================================================================
// AI Systems Auditor Checks
// ============================================================================

async function checkAISystems() {
  log("\n🤖 AI Systems Auditor Checks", "info");
  
  // Check for AI audit scripts
  const aiScripts = [
    "ai/self_diagnose.ts",
    "ai/privacy_guard.ts",
    "ai/ai_autoscale.ts",
  ];
  const foundAIScripts = aiScripts.filter((s) => fileExists(s));
  recordCheck(
    "AI Systems Auditor",
    "AI Monitoring",
    "AI audit scripts",
    foundAIScripts.length > 0,
    foundAIScripts.length > 0 ? "info" : "warning",
    foundAIScripts.length > 0
      ? `✅ Found ${foundAIScripts.length} AI audit script(s)`
      : "⚠️ No AI audit scripts found",
    foundAIScripts.length === 0 ? "Add AI system monitoring and auditing" : undefined
  );
  
  // Check for OpenAI API key configuration
  const hasOpenAIKey = !!(await secretsManager.getSecret('OPENAI_API_KEY')) || process.env.OPENAI_API_KEY;
  recordCheck(
    "AI Systems Auditor",
    "AI Configuration",
    "OpenAI API key configured",
    hasOpenAIKey,
    hasOpenAIKey ? "info" : "warning",
    hasOpenAIKey ? "✅ OpenAI API key configured" : "⚠️ OpenAI API key not found",
    hasOpenAIKey ? undefined : "Configure OPENAI_API_KEY for AI features"
  );
  
  // Check for AI cost controls
  const aiCostScripts = [
    "scripts/cost-guard.mjs",
    "ai/ai_autoscale.ts",
  ];
  const hasCostControls = aiCostScripts.some((s) => fileExists(s));
  recordCheck(
    "AI Systems Auditor",
    "Cost Management",
    "AI cost control scripts",
    hasCostControls,
    "warning",
    hasCostControls ? "✅ AI cost controls found" : "⚠️ No AI cost controls",
    hasCostControls ? undefined : "Add cost monitoring and controls for AI usage"
  );
  
  // Check for AI usage logging
  const aiLoggingFiles = globSync("**/*ai*.{ts,tsx,js}", {
    cwd: process.cwd(),
    ignore: ["**/node_modules/**", "**/.next/**", "**/dist/**"],
  });
  let hasLogging = false;
  aiLoggingFiles.slice(0, 5).forEach((file) => {
    if (fileContains(file, /log|audit|track/i)) {
      hasLogging = true;
    }
  });
  
  recordCheck(
    "AI Systems Auditor",
    "AI Usage Tracking",
    "AI usage logging",
    hasLogging,
    "warning",
    hasLogging ? "✅ AI usage logging detected" : "⚠️ Limited AI usage logging",
    hasLogging ? undefined : "Ensure AI API calls are logged for audit trails"
  );
}

// ============================================================================
// Growth Architect Checks
// ============================================================================

function checkGrowthSystems() {
  log("\n📈 Growth Architect Checks", "info");
  
  // Check for analytics configuration
  const analyticsVars = [
    "NEXT_PUBLIC_GA_ID",
    "NEXT_PUBLIC_POSTHOG_KEY",
    "NEXT_PUBLIC_POSTHOG_HOST",
  ];
  const hasAnalytics = analyticsVars.some((v) => !!process.env[v]);
  recordCheck(
    "Growth Architect",
    "Analytics",
    "Analytics configuration",
    hasAnalytics,
    "info",
    hasAnalytics ? "✅ Analytics configured" : "⚠️ No analytics configured",
    hasAnalytics ? undefined : "Configure analytics (GA, PostHog, etc.)"
  );
  
  // Check for growth scripts
  const growthScripts = globSync("scripts/**/*growth*.{js,mjs,ts}", { cwd: process.cwd() });
  recordCheck(
    "Growth Architect",
    "Growth Tools",
    "Growth automation scripts",
    growthScripts.length > 0,
    "info",
    growthScripts.length > 0
      ? `✅ Found ${growthScripts.length} growth script(s)`
      : "⚠️ No growth scripts found",
    growthScripts.length === 0 ? "Add growth automation scripts" : undefined
  );
  
  // Check for A/B testing/experimentation
  const experimentFiles = globSync("**/*experiment*.{ts,tsx,js,jsx}", {
    cwd: process.cwd(),
    ignore: ["**/node_modules/**"],
  });
  recordCheck(
    "Growth Architect",
    "Experimentation",
    "A/B testing infrastructure",
    experimentFiles.length > 0,
    "info",
    experimentFiles.length > 0
      ? `✅ Found ${experimentFiles.length} experiment file(s)`
      : "⚠️ No experimentation infrastructure",
    experimentFiles.length === 0 ? "Consider adding A/B testing capabilities" : undefined
  );
}

// ============================================================================
// Innovation Catalyst Checks (Performance, Architecture)
// ============================================================================

function checkInnovation() {
  log("\n🚀 Innovation Catalyst Checks", "info");
  
  // Check for Prisma schema
  const prismaSchema = globSync("**/schema.prisma", { cwd: process.cwd() });
  const hasPrisma = prismaSchema.length > 0;
  
  if (hasPrisma) {
    log("  Validating Prisma schema...", "info");
    const prismaValidate = runCmd("npx prisma validate", true);
    recordCheck(
      "Innovation Catalyst",
      "Database Schema",
      "Prisma schema validation",
      prismaValidate.success,
      prismaValidate.success ? "info" : "critical",
      prismaValidate.success
        ? "✅ Prisma schema valid"
        : `❌ Prisma validation failed: ${prismaValidate.output.slice(0, 100)}`,
      prismaValidate.success ? undefined : "Fix Prisma schema errors"
    );
    
    // Try to generate Prisma client
    log("  Generating Prisma client...", "info");
    const prismaGenerate = runCmd("npx prisma generate", true);
    recordCheck(
      "Innovation Catalyst",
      "Database Schema",
      "Prisma client generation",
      prismaGenerate.success,
      prismaGenerate.success ? "info" : "warning",
      prismaGenerate.success
        ? "✅ Prisma client generated"
        : `⚠️ Prisma generate failed: ${prismaGenerate.output.slice(0, 100)}`,
      prismaGenerate.success ? undefined : "Check Prisma configuration"
    );
  } else {
    recordCheck(
      "Innovation Catalyst",
      "Database Schema",
      "Prisma schema",
      false,
      "info",
      "ℹ️ No Prisma schema found (using Supabase directly)",
      undefined
    );
  }
  
  // Check for performance budgets
  const perfScripts = [
    "scripts/performance-budgets.js",
    "scripts/bundle-report.mjs",
  ];
  const hasPerfTools = perfScripts.some((s) => fileExists(s));
  recordCheck(
    "Innovation Catalyst",
    "Performance",
    "Performance budget tools",
    hasPerfTools,
    "info",
    hasPerfTools ? "✅ Performance tools found" : "⚠️ No performance budget tools",
    hasPerfTools ? undefined : "Add performance budget monitoring"
  );
  
  // Check for CI/CD configuration
  const cicdFiles = globSync(".github/workflows/*.yml", { cwd: process.cwd() });
  recordCheck(
    "Innovation Catalyst",
    "CI/CD",
    "GitHub Actions workflows",
    cicdFiles.length > 0,
    cicdFiles.length > 0 ? "info" : "warning",
    cicdFiles.length > 0
      ? `✅ Found ${cicdFiles.length} workflow(s)`
      : "⚠️ No GitHub Actions workflows found",
    cicdFiles.length === 0 ? "Set up CI/CD with GitHub Actions" : undefined
  );
  
  // Check package.json for security scripts
  const packageJson = readJsonFile("package.json");
  if (packageJson && packageJson.scripts) {
    const securityScripts = Object.keys(packageJson.scripts).filter((s) =>
      s.includes("security") || s.includes("audit") || s.includes("scan")
    );
    recordCheck(
      "Innovation Catalyst",
      "DevOps",
      "Security scripts in package.json",
      securityScripts.length > 0,
      securityScripts.length > 0 ? "info" : "warning",
      securityScripts.length > 0
        ? `✅ Found ${securityScripts.length} security script(s)`
        : "⚠️ No security scripts in package.json",
      securityScripts.length === 0 ? "Add security scanning scripts to package.json" : undefined
    );
  }
}

// ============================================================================
// Main Execution
// ============================================================================

function generateReport(): SecurityReport {
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const warnings = results.filter((r) => !r.passed && r.severity === "warning").length;
  const criticalFailures = results.filter((r) => !r.passed && r.severity === "critical");
  
  return {
    timestamp: new Date().toISOString(),
    passed,
    failed,
    warnings,
    results,
    criticalFailures,
  };
}

function printReport(report: SecurityReport) {
  logger.info('\n=== Security Self-Check Report ===');
  logger.info(
    `Checks: ${report.passed} passed, ${report.failed} failed, ${report.warnings} warnings`
  );
              
  if (report.criticalFailures.length > 0) {
    logger.info('\nCritical Failures:');
    report.criticalFailures.forEach((r) => {
      logger.info(`  ❌ ${r.check}: ${r.message}`);
      if (r.remediation) {
        logger.info(`     Fix: ${r.remediation}`);
      }
    });
  }
  
  // Group by lens
  const byLens: Record<string, CheckResult[]> = {};
  report.results.forEach((r) => {
    if (!byLens[r.lens]) byLens[r.lens] = [];
    byLens[r.lens].push(r);
  });
  
  Object.entries(byLens).forEach(([lens, lensResults]) => {
    logger.info(`\n${lens}`);
    const byCategory: Record<string, CheckResult[]> = {};
    lensResults.forEach((r) => {
      if (!byCategory[r.category]) byCategory[r.category] = [];
      byCategory[r.category].push(r);
    });
    
    Object.entries(byCategory).forEach(([category, categoryResults]) => {
      logger.info(`  ${category}`);
      categoryResults.forEach((r) => {
        const icon = r.passed ? "✅" : r.severity === "critical" ? "❌" : "⚠️";
        logger.info(`    ${icon} ${r.check}: ${r.message}`);
      });
    });
  });

  return report.criticalFailures.length === 0;
}

async function main() {
  logger.info('Running security self-check...\n');
  
  // Run all checks
  checkPrivacyCompliance();
  checkAccessibility();
  checkSecurityHeaders();
  checkCompliance();
  checkResilience();
  await checkAISystems();
  checkGrowthSystems();
  checkInnovation();
  
  // Generate and print report
  const report = generateReport();
  const success = printReport(report);
  
  // Save report to file
  const reportPath = path.join("DOCS", "launch-readiness", "security-self-check-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
  process.exit(success ? 0 : 1);
}

// Run main function
main().catch((error) => {
  logger.error('❌ Fatal error:', { error });
  process.exit(1);
});
