#!/usr/bin/env node

/**
 * Secrets Scanning Script
 * 
 * Scans codebase for potential hardcoded secrets and dangerous patterns
 * Run with: node scripts/secrets-scan.mjs
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const SECRET_PATTERNS = [
  // API Keys
  /api[_-]?key\s*[:=]\s*['"]([^'"]{20,})['"]/gi,
  /apikey\s*[:=]\s*['"]([^'"]{20,})['"]/gi,
  
  // Passwords
  /password\s*[:=]\s*['"]([^'"]{8,})['"]/gi,
  /passwd\s*[:=]\s*['"]([^'"]{8,})['"]/gi,
  
  // Secrets
  /secret\s*[:=]\s*['"]([^'"]{10,})['"]/gi,
  /secret[_-]?key\s*[:=]\s*['"]([^'"]{20,})['"]/gi,
  
  // Tokens
  /token\s*[:=]\s*['"]([^'"]{20,})['"]/gi,
  /access[_-]?token\s*[:=]\s*['"]([^'"]{20,})['"]/gi,
  /bearer\s+([a-zA-Z0-9_-]{20,})/gi,
  
  // Private Keys
  /private[_-]?key\s*[:=]\s*['"]-----BEGIN/gi,
  /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/gi,
  
  // AWS Keys
  /aws[_-]?access[_-]?key[_-]?id\s*[:=]\s*['"]([^'"]{20,})['"]/gi,
  /aws[_-]?secret[_-]?access[_-]?key\s*[:=]\s*['"]([^'"]{40,})['"]/gi,
  
  // Stripe Keys
  /sk_[a-zA-Z0-9]{32,}/g,
  /pk_[a-zA-Z0-9]{32,}/g,
  
  // OpenAI Keys
  /sk-[a-zA-Z0-9]{32,}/g,
  
  // GitHub Tokens
  /ghp_[a-zA-Z0-9]{36,}/g,
  /github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59,}/g,
];

const DANGEROUS_PATTERNS = [
  // eval() usage
  /eval\s*\(/gi,
  
  // Function constructor
  /new\s+Function\s*\(/gi,
  
  // Dangerous shell commands
  /(?<!\.)\bexec\s*\(/gi,
  /(?<!\.)\bspawn\s*\(/gi,
  /(?<!\.)\bexecSync\s*\(/gi,
  
  // SQL injection risks
  /\.query\s*\(\s*['"`]\s*SELECT.*\+.*['"`]/gi,
  /\.query\s*\(\s*['"`]\s*INSERT.*\+.*['"`]/gi,
];

const IGNORE_PATTERNS = [
  /node_modules/,
  /\.next/,
  /\.git/,
  /dist/,
  /build/,
  /coverage/,
  /\.env\.example/,
  /\.env\.local/,
  /secrets-scan\.mjs/,
  /\.test\./,
  /\.spec\./,
  /__tests__/,
  /__mocks__/,
  /packages[\\/]testing/,
  /vitest\.config\./,
  /scripts[\\/]/,
  /constants\.ts/,
];

const FILE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.json'];

let secretsFound = [];
let dangerousPatternsFound = [];

function shouldIgnoreFile(filePath) {
  return IGNORE_PATTERNS.some(pattern => pattern.test(filePath));
}

function scanFile(filePath) {
  if (shouldIgnoreFile(filePath)) {
    return;
  }

  try {
    const content = readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    // Check for secrets
    SECRET_PATTERNS.forEach((pattern, index) => {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        secretsFound.push({
          file: filePath,
          line: lineNumber,
          pattern: `Secret Pattern ${index + 1}`,
          match: match[0].substring(0, 50) + '...',
        });
      }
    });

    // Check for dangerous patterns
    DANGEROUS_PATTERNS.forEach((pattern, index) => {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        dangerousPatternsFound.push({
          file: filePath,
          line: lineNumber,
          pattern: `Dangerous Pattern ${index + 1}`,
          match: match[0].substring(0, 50),
        });
      }
    });
  } catch (error) {
    // Skip files that can't be read
  }
}

function scanDirectory(dir) {
  const entries = readdirSync(dir);
  
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    
    if (shouldIgnoreFile(fullPath)) {
      continue;
    }

    try {
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDirectory(fullPath);
      } else if (stat.isFile()) {
        const ext = extname(fullPath);
        if (FILE_EXTENSIONS.includes(ext)) {
          scanFile(fullPath);
        }
      }
    } catch (error) {
      // Skip entries that can't be accessed
    }
  }
}

// Main execution
console.log('🔍 Scanning for secrets and dangerous patterns...\n');

const startDir = process.cwd();
const scanDirs = ['apps', 'packages', 'scripts'].filter(dir => {
  try {
    return statSync(join(startDir, dir)).isDirectory();
  } catch {
    return false;
  }
});

if (scanDirs.length === 0) {
  console.log('⚠️  No directories to scan found.');
  process.exit(0);
}

scanDirs.forEach(dir => {
  console.log(`Scanning ${dir}/...`);
  scanDirectory(join(startDir, dir));
});

console.log('\n📊 Scan Results:\n');

if (secretsFound.length > 0) {
  console.log(`❌ Found ${secretsFound.length} potential secrets:\n`);
  secretsFound.slice(0, 20).forEach(secret => {
    console.log(`  ${secret.file}:${secret.line}`);
    console.log(`    Pattern: ${secret.pattern}`);
    console.log(`    Match: ${secret.match}\n`);
  });
  if (secretsFound.length > 20) {
    console.log(`  ... and ${secretsFound.length - 20} more\n`);
  }
} else {
  console.log('✅ No secrets found!\n');
}

if (dangerousPatternsFound.length > 0) {
  console.log(`⚠️  Found ${dangerousPatternsFound.length} dangerous patterns:\n`);
  dangerousPatternsFound.slice(0, 10).forEach(pattern => {
    console.log(`  ${pattern.file}:${pattern.line}`);
    console.log(`    Pattern: ${pattern.pattern}`);
    console.log(`    Match: ${pattern.match}\n`);
  });
  if (dangerousPatternsFound.length > 10) {
    console.log(`  ... and ${dangerousPatternsFound.length - 10} more\n`);
  }
} else {
  console.log('✅ No dangerous patterns found!\n');
}

// Exit with error if secrets found
if (secretsFound.length > 0) {
  console.log('💡 Tip: Move secrets to environment variables (.env.local)');
  process.exit(1);
} else if (dangerousPatternsFound.length > 0 && process.argv.includes('--strict')) {
  console.log('💡 Tip: Review dangerous patterns and use safer alternatives\n');
  process.exit(1);
} else {
  console.log('✅ Scan passed! No secret leaks detected.\n');
  process.exit(0);
}
