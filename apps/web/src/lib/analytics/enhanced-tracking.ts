import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('enhanced-tracking');

/**
 * Enhanced Analytics Tracking
 * Comprehensive event tracking with funnel analysis
 * Measurable: Better insights, identify drop-off points
 */

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, unknown>;
  userId?: string;
  sessionId?: string;
  timestamp?: string;
}

class EnhancedAnalytics {
  private sessionId: string;
  private userId: string | null = null;

  constructor() {
    // Generate or retrieve session ID
    if (typeof window !== 'undefined') {
      this.sessionId = sessionStorage.getItem('analytics_session_id') || this.generateSessionId();
      sessionStorage.setItem('analytics_session_id', this.sessionId);
    } else {
      this.sessionId = 'server-session';
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Track event with enhanced properties
   * Measurable: Better user behavior insights
   */
  async track(event: string, properties: Record<string, unknown> = {}): Promise<void> {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        page: typeof window !== 'undefined' ? window.location.pathname : undefined,
        referrer: typeof document !== 'undefined' ? document.referrer : undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        timestamp: new Date().toISOString(),
      },
      sessionId: this.sessionId,
      userId: this.userId || undefined,
    };

    // Send to analytics API
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(analyticsEvent),
      });
    } catch (error) {
      _logger.error('Analytics tracking error:', { error: error instanceof Error ? error.message : String(error) });
      // Fail silently - don't block user experience
    }
  }

  /**
   * Track funnel step
   * Measurable: Identify conversion drop-offs
   */
  async trackFunnelStep(
    stage: string,
    step: string,
    properties: Record<string, unknown> = {}
  ): Promise<void> {
    await this.track('funnel_step', {
      stage,
      step,
      ...properties,
    });
  }

  /**
   * Track conversion
   * Measurable: Measure conversion rates
   */
  async trackConversion(
    type: string,
    value?: number,
    properties: Record<string, unknown> = {}
  ): Promise<void> {
    await this.track('conversion', {
      conversionType: type,
      value,
      ...properties,
    });
  }

  /**
   * Track performance metric
   * Measurable: Monitor system performance
   */
  async trackPerformance(
    metric: string,
    value: number,
    unit: string = 'ms'
  ): Promise<void> {
    await this.track('performance_metric', {
      metric,
      value,
      unit,
    });
  }

  /**
   * Set user ID
   */
  setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * Track page view
   */
  async trackPageView(path: string, properties: Record<string, unknown> = {}): Promise<void> {
    await this.track('page_view', {
      path,
      ...properties,
    });
  }
}

export const analytics = new EnhancedAnalytics();

/**
 * React hook for analytics
 */
export function useAnalytics() {
  return analytics;
}
