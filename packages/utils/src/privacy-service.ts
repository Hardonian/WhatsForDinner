// @ts-nocheck
/**
 * Privacy & GDPR Service
 * Data protection and compliance management
 */

export interface PersonalData {
  id: string;
  type: 'email' | 'name' | 'phone' | 'address' | 'ip' | 'cookies' | 'other';
  value: string;
  purpose: string;
  retentionPeriod: number; // days
  consentRequired: boolean;
  consentGiven?: boolean;
  consentDate?: string;
  lastAccessed: string;
  createdAt: string;
}

export interface ConsentRecord {
  id: string;
  userId: string;
  purpose: string;
  granted: boolean;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  version: string;
}

class PrivacyService {
  private personalData: Map<string, PersonalData> = new Map();
  private consentRecords: Map<string, ConsentRecord> = new Map();
  private dataRetentionPolicies: Map<string, number> = new Map();

  constructor() {
    this.initializeRetentionPolicies();
  }

  private initializeRetentionPolicies() {
    this.dataRetentionPolicies.set('email', 365); // 1 year
    this.dataRetentionPolicies.set('name', 2555); // 7 years
    this.dataRetentionPolicies.set('phone', 365);
    this.dataRetentionPolicies.set('address', 2555);
    this.dataRetentionPolicies.set('ip', 90);
    this.dataRetentionPolicies.set('cookies', 30);
    this.dataRetentionPolicies.set('other', 365);
  }

  /**
   * Record personal data
   */
  recordPersonalData(data: Omit<PersonalData, 'id' | 'createdAt' | 'lastAccessed'>): string {
    const id = this.generateId();
    const now = new Date().toISOString();
    
    const personalData: PersonalData = {
      ...data,
      id,
      createdAt: now,
      lastAccessed: now
    };
    
    this.personalData.set(id, personalData);
    return id;
  }

  /**
   * Record consent
   */
  recordConsent(consent: Omit<ConsentRecord, 'id' | 'timestamp'>): string {
    const id = this.generateId();
    const now = new Date().toISOString();
    
    const consentRecord: ConsentRecord = {
      ...consent,
      id,
      timestamp: now
    };
    
    this.consentRecords.set(id, consentRecord);
    return id;
  }

  /**
   * Get user's personal data
   */
  getUserPersonalData(userId: string): PersonalData[] {
    return Array.from(this.personalData.values())
      .filter(data => data.id.includes(userId));
  }

  /**
   * Get user's consent records
   */
  getUserConsentRecords(userId: string): ConsentRecord[] {
    return Array.from(this.consentRecords.values())
      .filter(record => record.userId === userId);
  }

  /**
   * Request data erasure (Right to be forgotten)
   */
  async requestDataErasure(userId: string): Promise<{ success: boolean; erasedCount: number }> {
    const userData = this.getUserPersonalData(userId);
    let erasedCount = 0;
    
    for (const data of userData) {
      if (this.personalData.delete(data.id)) {
        erasedCount++;
      }
    }
    
    // Also remove consent records
    const userConsent = this.getUserConsentRecords(userId);
    for (const consent of userConsent) {
      this.consentRecords.delete(consent.id);
    }
    
    return { success: true, erasedCount };
  }

  /**
   * Export user data (Right to data portability)
   */
  exportUserData(userId: string): unknown {
    const personalData = this.getUserPersonalData(userId);
    const consentRecords = this.getUserConsentRecords(userId);
    
    return {
      userId,
      exportedAt: new Date().toISOString(),
      personalData,
      consentRecords,
      format: 'JSON',
      version: '1.0'
    };
  }

  /**
   * Check data retention compliance
   */
  checkDataRetentionCompliance(): { compliant: boolean; violations: string[] } {
    const violations: string[] = [];
    const now = new Date();
    
    for (const [id, data] of this.personalData) {
      const retentionPeriod = this.dataRetentionPolicies.get(data.type) || 365;
      const createdAt = new Date(data.createdAt);
      const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceCreation > retentionPeriod) {
        violations.push(`Data ${id} (type: ${data.type}) exceeds retention period`);
      }
    }
    
    return {
      compliant: violations.length === 0,
      violations
    };
  }

  /**
   * Clean up expired data
   */
  async cleanupExpiredData(): Promise<number> {
    const now = new Date();
    let cleanedCount = 0;
    
    for (const [id, data] of this.personalData) {
      const retentionPeriod = this.dataRetentionPolicies.get(data.type) || 365;
      const createdAt = new Date(data.createdAt);
      const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceCreation > retentionPeriod) {
        if (this.personalData.delete(id)) {
          cleanedCount++;
        }
      }
    }
    
    return cleanedCount;
  }

  /**
   * Generate privacy report
   */
  generatePrivacyReport(): unknown {
    const totalPersonalData = this.personalData.size;
    const totalConsentRecords = this.consentRecords.size;
    const retentionCompliance = this.checkDataRetentionCompliance();
    
    return {
      timestamp: new Date().toISOString(),
      totalPersonalData,
      totalConsentRecords,
      retentionCompliance,
      dataTypes: this.getDataTypeBreakdown(),
      consentBreakdown: this.getConsentBreakdown()
    };
  }

  private getDataTypeBreakdown() {
    const breakdown: Record<string, number> = {};
    
    for (const data of this.personalData.values()) {
      breakdown[data.type] = (breakdown[data.type] || 0) + 1;
    }
    
    return breakdown;
  }

  private getConsentBreakdown() {
    const breakdown = { granted: 0, denied: 0 };
    
    for (const consent of this.consentRecords.values()) {
      if (consent.granted) {
        breakdown.granted++;
      } else {
        breakdown.denied++;
      }
    }
    
    return breakdown;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

export default PrivacyService;
