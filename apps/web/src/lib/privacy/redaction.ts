import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('redaction');

/**
 * Local-First Privacy Redaction
 * Strips sensitive data on-device before sending to server
 */

export interface TelemetryEvent {
  app_id: string;
  event_type: 'app_focus' | 'app_switch' | 'window_change' | 'duration' | 'interaction';
  duration_ms?: number;
  metadata?: Record<string, unknown>;
}

// Fields that should never be collected
const SENSITIVE_FIELDS = [
  'password',
  'passwd',
  'secret',
  'token',
  'api_key',
  'private_key',
  'credit_card',
  'ssn',
  'social_security',
  'email', // Optional: can be redacted if user prefers
  'phone',
  'address',
];

// Patterns that indicate sensitive content
const SENSITIVE_PATTERNS = [
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Credit card numbers
  /\b\d{3}-\d{2}-\d{4}\b/, // SSN
  /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}/, // Email addresses
];

/**
 * Redact sensitive fields from metadata
 */
export function redactMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const redacted: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(metadata)) {
    // Check if key is sensitive
    if (SENSITIVE_FIELDS.some((field) => key.toLowerCase().includes(field.toLowerCase()))) {
      redacted[key] = '[REDACTED]';
      continue;
    }

    // Check if value contains sensitive patterns
    if (typeof value === 'string') {
      let redactedValue = value;
      for (const pattern of SENSITIVE_PATTERNS) {
        if (pattern.test(redactedValue)) {
          redactedValue = redactedValue.replace(pattern, '[REDACTED]');
        }
      }
      redacted[key] = redactedValue;
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Recursively redact nested objects
      redacted[key] = redactMetadata(value as Record<string, unknown>);
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
}

/**
 * Hash sensitive identifiers for privacy-preserving analytics
 */
export function hashIdentifier(identifier: string): string {
  // Use Web Crypto API for hashing (available in browsers and Node.js)
  // In production, use a proper hash function
  const encoder = new TextEncoder();
  const data = encoder.encode(identifier);
  
  // Note: This is a simplified version. In production, use crypto.subtle.digest
  // For now, return a placeholder hash
  return btoa(identifier).substring(0, 16);
}

/**
 * Validate telemetry event before sending
 */
export function validateTelemetryEvent(event: TelemetryEvent): {
  valid: boolean;
  error?: string;
  redacted?: TelemetryEvent;
} {
  // Check required fields
  if (!event.app_id || !event.event_type) {
    return { valid: false, error: 'Missing required fields' };
  }

  // Redact metadata
  const redactedMetadata = event.metadata ? redactMetadata(event.metadata) : {};

  // Check for disallowed content
  const metadataStr = JSON.stringify(redactedMetadata);
  if (SENSITIVE_PATTERNS.some((pattern) => pattern.test(metadataStr))) {
    return {
      valid: false,
      error: 'Event contains sensitive content that cannot be redacted',
    };
  }

  return {
    valid: true,
    redacted: {
      ...event,
      metadata: redactedMetadata,
    },
  };
}

/**
 * Sample telemetry event based on sampling rate
 */
export function shouldSample(samplingRate: number): boolean {
  return Math.random() < samplingRate;
}

/**
 * Rate limit telemetry events (prevent flooding)
 */
export class TelemetryRateLimiter {
  private events: Map<string, number[]> = new Map();
  private readonly maxEventsPerMinute = 100;
  private readonly maxEventsPerHour = 1000;

  shouldAllow(appId: string): boolean {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    const oneHourAgo = now - 60 * 60 * 1000;

    if (!this.events.has(appId)) {
      this.events.set(appId, []);
    }

    const appEvents = this.events.get(appId)!;

    // Clean old events
    const recentEvents = appEvents.filter((ts) => ts > oneMinuteAgo);
    const hourlyEvents = appEvents.filter((ts) => ts > oneHourAgo);

    // Check rate limits
    if (recentEvents.length >= this.maxEventsPerMinute) {
      return false;
    }

    if (hourlyEvents.length >= this.maxEventsPerHour) {
      return false;
    }

    // Record this event
    recentEvents.push(now);
    this.events.set(appId, recentEvents);

    return true;
  }

  reset() {
    this.events.clear();
  }
}

/**
 * Process telemetry event locally before sending
 */
export function processTelemetryEvent(
  event: TelemetryEvent,
  samplingRate: number = 1.0,
  rateLimiter?: TelemetryRateLimiter
): TelemetryEvent | null {
  // Check sampling
  if (!shouldSample(samplingRate)) {
    return null;
  }

  // Check rate limiting
  if (rateLimiter && !rateLimiter.shouldAllow(event.app_id)) {
    return null;
  }

  // Validate and redact
  const validation = validateTelemetryEvent(event);
  if (!validation.valid || !validation.redacted) {
    if (process.env.NODE_ENV === 'development') { _logger.warn('Telemetry event validation failed:', { error: validation.error }); }
    return null;
  }

  return validation.redacted;
}
