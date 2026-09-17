/**
 * Secrets Intelligence Module - Zero-Trust Secrets Handling
 * Implements auto-rotation, security scanning, and vault management
 */

import { logger } from './logger';
const crypto = typeof require !== 'undefined' ? require('crypto') : (typeof window !== 'undefined' ? (window.crypto as any) : null);

export interface Secret {
  id: string;
  name: string;
  type:
    | 'api_key'
    | 'database_password'
    | 'jwt_secret'
    | 'encryption_key'
    | 'oauth_token';
  value: string;
  hash: string;
  createdAt: string;
  lastRotated: string;
  nextRotation: string;
  rotationInterval: number; // days
  isActive: boolean;
  environment: 'development' | 'staging' | 'production';
  tags: string[];
  accessLog: Array<{
    timestamp: string;
    action: 'read' | 'write' | 'rotate' | 'delete';
    source: string;
    success: boolean;
  }>;
}

export interface SecretVault {
  id: string;
  name: string;
  environment: string;
  encryptionKey: string;
  secrets: Map<string, Secret>;
  lastBackup: string;
  accessPolicy: {
    allowedSources: string[];
    maxAccessPerHour: number;
    requireMFA: boolean;
  };
}

export interface SecurityScanResult {
  secretId: string;
  vulnerabilities: Array<{
    type:
      | 'weak_encryption'
      | 'exposed_in_logs'
      | 'hardcoded_value'
      | 'insecure_storage'
      | 'excessive_access';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    recommendation: string;
    detectedAt: string;
  }>;
  riskScore: number; // 0-100
  lastScanned: string;
}

export interface SecretsManifest {
  version: string;
  generatedAt: string;
  environment: string;
  secrets: Array<{
    id: string;
    name: string;
    type: string;
    hash: string;
    lastRotated: string;
    nextRotation: string;
    isActive: boolean;
    tags: string[];
  }>;
  vaults: Array<{
    id: string;
    name: string;
    environment: string;
    secretCount: number;
    lastBackup: string;
  }>;
  securityStatus: {
    totalSecrets: number;
    activeSecrets: number;
    secretsNeedingRotation: number;
    highRiskSecrets: number;
    lastFullScan: string;
  };
}

export class SecretsIntelligence {
  private vaults: Map<string, SecretVault> = new Map();
  private rotationSchedule: Map<string, NodeJS.Timeout> = new Map();
  private scanSchedule: NodeJS.Timeout | null = null;
  private secretsManifest: SecretsManifest | null = null;

  constructor() {
    this.initializeDefaultVaults();
    this.startRotationScheduler();
    this.startSecurityScanning();
  }

  /**
   * Initialize default vaults for different environments
   */
  private initializeDefaultVaults(): void {
    const environments = ['development', 'staging', 'production'];

    for (const env of environments) {
      const vault: SecretVault = {
        id: `vault-${env}`,
        name: `${env.toUpperCase()} Vault`,
        environment: env,
        encryptionKey: this.generateEncryptionKey(),
        secrets: new Map(),
        lastBackup: new Date().toISOString(),
        accessPolicy: {
          allowedSources: ['autonomous-system', 'build-agent', 'heal-agent'],
          maxAccessPerHour: env === 'production' ? 10 : 100,
          requireMFA: env === 'production',
        },
      };

      this.vaults.set(vault.id, vault);
      logger.info(`Initialized vault: ${vault.name}`);
    }
  }

  /**
   * Store a secret in the appropriate vault
   */
  async storeSecret(
    name: string,
    value: string,
    type: Secret['type'],
    environment: string,
    options: {
      rotationInterval?: number;
      tags?: string[];
      customVaultId?: string;
    } = {}
  ): Promise<string> {
    try {
      const vaultId = options.customVaultId || `vault-${environment}`;
      const vault = this.vaults.get(vaultId);

      if (!vault) {
        throw new Error(`Vault not found: ${vaultId}`);
      }

      // Generate secret ID and hash
      const secretId = this.generateSecretId();
      const hash = this.hashSecret(value);

      // Create secret object
      const secret: Secret = {
        id: secretId,
        name,
        type,
        value: this.encryptSecret(value, vault.encryptionKey),
        hash,
        createdAt: new Date().toISOString(),
        lastRotated: new Date().toISOString(),
        nextRotation: this.calculateNextRotation(
          options.rotationInterval || 30
        ),
        rotationInterval: options.rotationInterval || 30,
        isActive: true,
        environment,
        tags: options.tags || [],
        accessLog: [],
      };

      // Store in vault
      vault.secrets.set(secretId, secret);

      // Log access
      this.logSecretAccess(secretId, 'write', 'secrets-intelligence', true);

      // Schedule rotation if needed
      this.scheduleSecretRotation(secret);

      logger.info(`Secret stored: ${name} in ${vault.name}`);

      return secretId;
    } catch (error) {
      logger.error('Failed to store secret', {
        error,
        name,
        type,
        environment,
      });
      throw error;
    }
  }

  /**
   * Retrieve a secret from vault
   */
  async getSecret(secretId: string, source: string): Promise<Secret | null> {
    try {
      const vault = this.findVaultBySecretId(secretId);
      if (!vault) {
        logger.warn(`Secret not found: ${secretId}`);
        return null;
      }

      const secret = vault.secrets.get(secretId);
      if (!secret) {
        logger.warn(`Secret not found in vault: ${secretId}`);
        return null;
      }

      // Check access policy
      if (!this.validateAccess(secret, source, vault)) {
        logger.warn(
          `Access denied for secret: ${secretId} by source: ${source}`
        );
        this.logSecretAccess(secretId, 'read', source, false);
        return null;
      }

      // Log access
      this.logSecretAccess(secretId, 'read', source, true);

      // Return decrypted secret
      const decryptedSecret = {
        ...secret,
        value: this.decryptSecret(secret.value, vault.encryptionKey),
      };

      return decryptedSecret;
    } catch (error) {
      logger.error('Failed to retrieve secret', { error, secretId, source });
      this.logSecretAccess(secretId, 'read', source, false);
      return null;
    }
  }

  /**
   * Rotate a secret
   */
  async rotateSecret(secretId: string, newValue?: string): Promise<boolean> {
    try {
      const vault = this.findVaultBySecretId(secretId);
      if (!vault) {
        logger.warn(`Secret not found for rotation: ${secretId}`);
        return false;
      }

      const secret = vault.secrets.get(secretId);
      if (!secret) {
        logger.warn(`Secret not found in vault for rotation: ${secretId}`);
        return false;
      }

      // Generate new value if not provided
      const rotatedValue = newValue || this.generateSecretValue(secret.type);
      const newHash = this.hashSecret(rotatedValue);

      // Update secret
      secret.value = this.encryptSecret(rotatedValue, vault.encryptionKey);
      secret.hash = newHash;
      secret.lastRotated = new Date().toISOString();
      secret.nextRotation = this.calculateNextRotation(secret.rotationInterval);

      // Log rotation
      this.logSecretAccess(secretId, 'rotate', 'secrets-intelligence', true);

      // Reschedule rotation
      this.scheduleSecretRotation(secret);

      logger.info(`Secret rotated: ${secret.name}`);

      return true;
    } catch (error) {
      logger.error('Failed to rotate secret', { error, secretId });
      this.logSecretAccess(secretId, 'rotate', 'secrets-intelligence', false);
      return false;
    }
  }

  /**
   * Delete a secret
   */
  async deleteSecret(secretId: string, source: string): Promise<boolean> {
    try {
      const vault = this.findVaultBySecretId(secretId);
      if (!vault) {
        logger.warn(`Secret not found for deletion: ${secretId}`);
        return false;
      }

      const secret = vault.secrets.get(secretId);
      if (!secret) {
        logger.warn(`Secret not found in vault for deletion: ${secretId}`);
        return false;
      }

      // Check if secret is in production
      if (secret.environment === 'production') {
        logger.warn(`Cannot delete production secret: ${secretId}`);
        return false;
      }

      // Remove from vault
      vault.secrets.delete(secretId);

      // Cancel rotation schedule
      const rotationTimeout = this.rotationSchedule.get(secretId);
      if (rotationTimeout) {
        clearTimeout(rotationTimeout);
        this.rotationSchedule.delete(secretId);
      }

      // Log deletion
      this.logSecretAccess(secretId, 'delete', source, true);

      logger.info(`Secret deleted: ${secret.name}`);

      return true;
    } catch (error) {
      logger.error('Failed to delete secret', { error, secretId, source });
      this.logSecretAccess(secretId, 'delete', source, false);
      return false;
    }
  }

  /**
   * Scan secrets for security vulnerabilities
   */
  async scanSecretsForVulnerabilities(): Promise<SecurityScanResult[]> {
    const results: SecurityScanResult[] = [];

    for (const vault of this.vaults.values()) {
      for (const secret of vault.secrets.values()) {
        const scanResult = await this.scanSecret(secret, vault);
        results.push(scanResult);
      }
    }

    logger.info(`Security scan completed. Scanned ${results.length} secrets`);
    return results;
  }

  /**
   * Generate secrets manifest
   */
  async generateSecretsManifest(): Promise<SecretsManifest> {
    const manifest: SecretsManifest = {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      environment: 'all',
      secrets: [],
      vaults: [],
      securityStatus: {
        totalSecrets: 0,
        activeSecrets: 0,
        secretsNeedingRotation: 0,
        highRiskSecrets: 0,
        lastFullScan: new Date().toISOString(),
      },
    };

    // Collect secret information
    for (const vault of this.vaults.values()) {
      const vaultInfo = {
        id: vault.id,
        name: vault.name,
        environment: vault.environment,
        secretCount: vault.secrets.size,
        lastBackup: vault.lastBackup,
      };
      manifest.vaults.push(vaultInfo);

      for (const secret of vault.secrets.values()) {
        manifest.secrets.push({
          id: secret.id,
          name: secret.name,
          type: secret.type,
          hash: secret.hash,
          lastRotated: secret.lastRotated,
          nextRotation: secret.nextRotation,
          isActive: secret.isActive,
          tags: secret.tags,
        });

        manifest.securityStatus.totalSecrets++;
        if (secret.isActive) manifest.securityStatus.activeSecrets++;

        if (new Date(secret.nextRotation) <= new Date()) {
          manifest.securityStatus.secretsNeedingRotation++;
        }
      }
    }

    // Scan for high-risk secrets
    const scanResults = await this.scanSecretsForVulnerabilities();
    manifest.securityStatus.highRiskSecrets = scanResults.filter(
      result => result.riskScore > 70
    ).length;

    this.secretsManifest = manifest;

    // Save manifest to file
    await this.saveSecretsManifest(manifest);

    logger.info('Secrets manifest generated', { manifest });
    return manifest;
  }

  /**
   * Start rotation scheduler
   */
  private startRotationScheduler(): void {
    // Check for secrets needing rotation every hour
    setInterval(
      async () => {
        await this.processRotationQueue();
      },
      60 * 60 * 1000
    ); // 1 hour

    logger.info('Secret rotation scheduler started');
  }

  /**
   * Start security scanning
   */
  private startSecurityScanning(): void {
    // Run security scan daily
    this.scanSchedule = setInterval(
      async () => {
        await this.scanSecretsForVulnerabilities();
      },
      24 * 60 * 60 * 1000
    ); // 24 hours

    logger.info('Security scanning scheduler started');
  }

  /**
   * Process rotation queue
   */
  private async processRotationQueue(): Promise<void> {
    const now = new Date();
    const secretsToRotate: string[] = [];

    for (const vault of this.vaults.values()) {
      for (const secret of vault.secrets.values()) {
        if (secret.isActive && new Date(secret.nextRotation) <= now) {
          secretsToRotate.push(secret.id);
        }
      }
    }

    if (secretsToRotate.length > 0) {
      logger.info(`Rotating ${secretsToRotate.length} secrets`);

      for (const secretId of secretsToRotate) {
        await this.rotateSecret(secretId);
      }
    }
  }

  /**
   * Schedule secret rotation
   */
  private scheduleSecretRotation(secret: Secret): void {
    const rotationTime = new Date(secret.nextRotation).getTime() - Date.now();

    if (rotationTime > 0) {
      const timeout = setTimeout(async () => {
        await this.rotateSecret(secret.id);
      }, rotationTime);

      this.rotationSchedule.set(secret.id, timeout);
    }
  }

  /**
   * Scan individual secret for vulnerabilities
   */
  private async scanSecret(
    secret: Secret,
    vault: SecretVault
  ): Promise<SecurityScanResult> {
    const vulnerabilities: SecurityScanResult['vulnerabilities'] = [];
    let riskScore = 0;

    // Check for weak encryption
    if (secret.value.length < 32) {
      vulnerabilities.push({
        type: 'weak_encryption',
        severity: 'high',
        description: 'Secret value is too short',
        recommendation: 'Use longer, more complex secret values',
        detectedAt: new Date().toISOString(),
      });
      riskScore += 30;
    }

    // Check for excessive access
    const recentAccess = secret.accessLog.filter(
      log =>
        new Date(log.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    );

    if (recentAccess.length > vault.accessPolicy.maxAccessPerHour * 24) {
      vulnerabilities.push({
        type: 'excessive_access',
        severity: 'medium',
        description: 'Secret accessed too frequently',
        recommendation: 'Review access patterns and implement rate limiting',
        detectedAt: new Date().toISOString(),
      });
      riskScore += 20;
    }

    // Check rotation age
    const daysSinceRotation = Math.floor(
      (Date.now() - new Date(secret.lastRotated).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (daysSinceRotation > secret.rotationInterval) {
      vulnerabilities.push({
        type: 'insecure_storage',
        severity: 'medium',
        description: 'Secret has not been rotated on schedule',
        recommendation: 'Rotate secret immediately',
        detectedAt: new Date().toISOString(),
      });
      riskScore += 25;
    }

    // Check for hardcoded patterns
    if (this.detectHardcodedPattern(secret.value)) {
      vulnerabilities.push({
        type: 'hardcoded_value',
        severity: 'critical',
        description: 'Secret appears to be hardcoded',
        recommendation: 'Use environment variables or secure vault',
        detectedAt: new Date().toISOString(),
      });
      riskScore += 50;
    }

    return {
      secretId: secret.id,
      vulnerabilities,
      riskScore: Math.min(riskScore, 100),
      lastScanned: new Date().toISOString(),
    };
  }

  /**
   * Detect hardcoded patterns in secret values
   */
  private detectHardcodedPattern(value: string): boolean {
    const hardcodedPatterns = [
      /password/i,
      /secret/i,
      /key/i,
      /token/i,
      /123456/,
      /admin/,
      /test/,
    ];

    return hardcodedPatterns.some(pattern => pattern.test(value));
  }

  /**
   * Find vault by secret ID
   */
  private findVaultBySecretId(secretId: string): SecretVault | null {
    for (const vault of this.vaults.values()) {
      if (vault.secrets.has(secretId)) {
        return vault;
      }
    }
    return null;
  }

  /**
   * Validate access to secret
   */
  private validateAccess(
    secret: Secret,
    source: string,
    vault: SecretVault
  ): boolean {
    // Check if source is allowed
    if (!vault.accessPolicy.allowedSources.includes(source)) {
      return false;
    }

    // Check access rate limits
    const recentAccess = secret.accessLog.filter(
      log => new Date(log.timestamp) > new Date(Date.now() - 60 * 60 * 1000)
    );

    if (recentAccess.length >= vault.accessPolicy.maxAccessPerHour) {
      return false;
    }

    return true;
  }

  /**
   * Log secret access
   */
  private logSecretAccess(
    secretId: string,
    action: 'read' | 'write' | 'rotate' | 'delete',
    source: string,
    success: boolean
  ): void {
    const vault = this.findVaultBySecretId(secretId);
    if (vault) {
      const secret = vault.secrets.get(secretId);
      if (secret) {
        secret.accessLog.push({
          timestamp: new Date().toISOString(),
          action,
          source,
          success,
        });

        // Keep only last 1000 access logs
        if (secret.accessLog.length > 1000) {
          secret.accessLog = secret.accessLog.slice(-1000);
        }
      }
    }
  }

  /**
   * Generate secret ID
   */
  private generateSecretId(): string {
    return `secret_${crypto.randomUUID()}`;
  }

  /**
   * Generate encryption key
   */
  private generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Hash secret value
   */
  private hashSecret(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex');
  }

  /**
   * Encrypt secret value
   */
  private encryptSecret(value: string, key: string): string {
    const cipher = crypto.createCipher('aes-256-cbc', key);
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  /**
   * Decrypt secret value
   */
  private decryptSecret(encryptedValue: string, key: string): string {
    const decipher = crypto.createDecipher('aes-256-cbc', key);
    let decrypted = decipher.update(encryptedValue, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Generate secret value based on type
   */
  private generateSecretValue(type: Secret['type']): string {
    const length = type === 'encryption_key' ? 64 : 32;
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Calculate next rotation date
   */
  private calculateNextRotation(rotationInterval: number): string {
    const nextRotation = new Date();
    nextRotation.setDate(nextRotation.getDate() + rotationInterval);
    return nextRotation.toISOString();
  }

  /**
   * Save secrets manifest to file
   */
  private async saveSecretsManifest(manifest: SecretsManifest): Promise<void> {
    // In a real implementation, this would save to a secure file system
    logger.info('Secrets manifest saved', { manifest });
  }

  /**
   * Get vault information
   */
  getVaultInfo(vaultId: string): SecretVault | null {
    return this.vaults.get(vaultId) || null;
  }

  /**
   * Get all vaults
   */
  getAllVaults(): SecretVault[] {
    return Array.from(this.vaults.values());
  }

  /**
   * Get secrets manifest
   */
  getSecretsManifest(): SecretsManifest | null {
    return this.secretsManifest;
  }

  /**
   * Shutdown the secrets intelligence system
   */
  shutdown(): void {
    // Clear all rotation schedules
    for (const timeout of this.rotationSchedule.values()) {
      clearTimeout(timeout);
    }
    this.rotationSchedule.clear();

    // Clear security scan schedule
    if (this.scanSchedule) {
      clearInterval(this.scanSchedule);
      this.scanSchedule = null;
    }

    logger.info('Secrets intelligence system shutdown');
  }
}

// Export singleton instance
export const secretsIntelligence = new SecretsIntelligence();
