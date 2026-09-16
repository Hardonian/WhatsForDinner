/**
 * Analytics Configuration - stubbed for build compatibility
 */
export const config: Record<string, any> = {};

export function initAnalytics(): void {}

export function trackEvent(eventName: string, properties?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  (window as any).posthog?.capture(eventName, properties);
  (window as any).mixpanel?.track(eventName, properties);
  (window as any).gtag?.('event', eventName, properties);
  (window as any).amplitude?.track?.(eventName, properties);
}

export function identifyUser(userId: string, traits?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  (window as any).posthog?.identify(userId, traits);
  (window as any).mixpanel?.identify(userId);
  (window as any).gtag?.('set', { user_id: userId });
  (window as any).amplitude?.setUserId?.(userId);
}
