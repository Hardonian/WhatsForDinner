import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('analytics');

/**
 * Analytics and Engagement Tracking
 * Provides event tracking and user engagement metrics
 */

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
  userId?: string;
  timestamp?: Date;
}

class Analytics {
  private userId: string | null = null;
  private sessionId: string;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
  }

  private getOrCreateSessionId(): string {
    if (typeof window === 'undefined') return '';
    
    const stored = sessionStorage.getItem('analytics_session_id');
    if (stored) return stored;

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
    return sessionId;
  }

  setUserId(userId: string): void {
    this.userId = userId;
    if (typeof window !== 'undefined') {
      localStorage.setItem('analytics_user_id', userId);
    }
  }

  clearUserId(): void {
    this.userId = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('analytics_user_id');
    }
  }

  track(event: string, properties?: Record<string, unknown>): void {
    const analyticsEvent: AnalyticsEvent = {
      name: event,
      properties: {
        ...properties,
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
      },
      userId: this.userId || undefined,
    };

    // Send to analytics service (Google Analytics, Mixpanel, etc.)
    if (typeof window !== 'undefined') {
      // Google Analytics
      if ((window as any).gtag) {
        (window as any).gtag('event', event, {
          ...properties,
          user_id: this.userId,
        });
      }

      // Mixpanel
      if ((window as any).mixpanel) {
        (window as any).mixpanel.track(event, properties);
      }

      // Custom analytics endpoint
      this.sendToEndpoint(analyticsEvent);
    }
  }

  private async sendToEndpoint(event: AnalyticsEvent): Promise<void> {
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });
    } catch (error) {
      _logger.error('Failed to send analytics event:', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  // Page view tracking
  pageView(path: string, title?: string): void {
    this.track('page_view', {
      path,
      title: title || document.title,
    });
  }

  // User engagement events
  click(element: string, properties?: Record<string, unknown>): void {
    this.track('click', { element, ...properties });
  }

  view(element: string, properties?: Record<string, unknown>): void {
    this.track('view', { element, ...properties });
  }

  conversion(type: string, value?: number, properties?: Record<string, unknown>): void {
    this.track('conversion', {
      type,
      value,
      ...properties,
    });
  }

  // Time tracking
  startTimer(name: string): () => void {
    const startTime = Date.now();
    return () => {
      const duration = Date.now() - startTime;
      this.track('timer', {
        name,
        duration,
      });
    };
  }
}

export const analytics = new Analytics();
