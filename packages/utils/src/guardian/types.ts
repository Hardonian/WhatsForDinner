// @ts-nocheck
/**
 * Guardian System - Core Types
 * Self-governing privacy guardian that monitors data access and builds trust
 */

export type DataScope = 'user' | 'app' | 'api' | 'external';
export type DataClass = 'telemetry' | 'location' | 'audio' | 'biometrics' | 'content' | 'credentials' | 'personal_info' | 'metadata';
export type RiskLevel = 'low' | 'medium' | 'high';
export type ResponseAction = 'allow' | 'mask' | 'redact' | 'block' | 'alert';

export interface GuardianEvent {
  eventId: string;
  timestamp: string;
  userId: string;
  scope: DataScope;
  dataClass: DataClass;
  action: string; // e.g., 'api_call', 'content_process', 'telemetry_send'
  target: string; // e.g., 'api.openai.com', 'local_storage', 'analytics'
  metadata: {
    path?: string;
    method?: string;
    payloadSize?: number;
    duration?: number;
    [key: string]: unknown;
  };
  riskScore: number; // 0-100
  riskLevel: RiskLevel;
  guardianAction: ResponseAction;
  explanation: string; // User-friendly explanation
  fingerprint: string; // SHA256 hash for integrity
  previousHash?: string; // For hash chaining
}

export interface RiskAssessment {
  riskScore: number;
  riskLevel: RiskLevel;
  factors: Array<{
    factor: string;
    impact: number;
    likelihood: number;
    weight: number;
  }>;
  guardianAction: ResponseAction;
  explanation: string;
}

export interface TrustReport {
  userId: string;
  periodStart: string;
  periodEnd: string;
  totalEvents: number;
  eventsByRisk: {
    low: number;
    medium: number;
    high: number;
  };
  eventsByClass: Record<DataClass, number>;
  eventsByScope: Record<DataScope, number>;
  actionsTaken: Record<ResponseAction, number>;
  trustScore: number; // 0-100, based on safe operations
  anomalies: Array<{
    type: string;
    description: string;
    timestamp: string;
  }>;
  policyChanges: Array<{
    timestamp: string;
    change: string;
  }>;
  confidenceScore: number; // % of safe operations
  generatedAt: string;
}

export interface PolicyConfig {
  allowedScopes: DataScope[];
  dataClasses: {
    [key in DataClass]: {
      riskWeight: number; // 0-1
      defaultAction: ResponseAction;
      requiresConsent: boolean;
    };
  };
  riskWeights: {
    impact: number; // 0-1
    likelihood: number; // 0-1
  };
  responseActions: {
    [key in ResponseAction]: {
      threshold: number; // Risk score threshold
      description: string;
    };
  };
}

export interface TrustFabricModel {
  userId: string;
  comfortZones: {
    [key in DataClass]?: {
      averageTrust: number; // 0-100
      preferredAction: ResponseAction;
      disabledSignals: string[];
    };
  };
  privacyModeToggles: number; // Count of times user toggled privacy modes
  averageTrustResponses: Record<ResponseAction, number>;
  learnedPreferences: {
    alwaysAllows: DataClass[];
    alwaysBlocks: DataClass[];
    frequentlyModified: string[];
  };
  lastUpdated: string;
}

export interface GuardianLedgerEntry {
  eventId: string;
  timestamp: string;
  type: 'guardian_event' | 'policy_change' | 'user_action' | 'system_event';
  scope: DataScope;
  userDecision?: ResponseAction;
  guardianAction: ResponseAction;
  sha256: string;
  previousHash?: string;
  metadata: Record<string, unknown>;
}
