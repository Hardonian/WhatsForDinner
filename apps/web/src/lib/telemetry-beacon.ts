/**
 * Performance Intelligence Layer: Telemetry Beacon
 * Lightweight client-side performance metrics collection
 */

interface TelemetryData {
  url: string;
  ttfb?: number;
  lcp?: number;
  cls?: number;
  fid?: number;
  fcp?: number;
  ts?: number;
  userAgent?: string;
  connectionType?: string;
}

/**
 * Send telemetry data via sendBeacon (non-blocking)
 */
export function sendTelemetry(data: TelemetryData) {
  if (typeof navigator === 'undefined' || !navigator.sendBeacon) {
    // Fallback to fetch if sendBeacon not available
    fetch('/api/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        ts: Date.now(),
      }),
      keepalive: true,
    }).catch(() => {
      // Silently fail - telemetry should never break the app
    });
    return;
  }

  const payload = JSON.stringify({
    ...data,
    ts: Date.now(),
  });

  navigator.sendBeacon('/api/telemetry', payload);
}

/**
 * Collect Web Vitals and send telemetry
 */
export function initTelemetry() {
  if (typeof window === 'undefined') return;

  // Collect navigation timing
  if ('performance' in window && 'getEntriesByType' in performance) {
    const navEntries = performance.getEntriesByType(
      'navigation'
    ) as PerformanceNavigationTiming[];

    if (navEntries.length > 0) {
      const nav = navEntries[0];
      sendTelemetry({
        url: window.location.pathname,
        ttfb: nav.responseStart - nav.requestStart,
        fcp: nav.domContentLoadedEventEnd - nav.fetchStart,
        userAgent: navigator.userAgent.substring(0, 100),
        connectionType:
          (navigator as any).connection?.effectiveType || undefined,
      });
    }
  }

  // Collect Web Vitals if available
  if (typeof window !== 'undefined' && 'web-vitals' in window) {
    // Dynamic import to avoid bundle bloat
    import('web-vitals').then(({ onLCP, onCLS, onFID }) => {
      onLCP((metric) => {
        sendTelemetry({
          url: window.location.pathname,
          lcp: metric.value,
        });
      });

      onCLS((metric) => {
        sendTelemetry({
          url: window.location.pathname,
          cls: metric.value,
        });
      });

      onFID((metric) => {
        sendTelemetry({
          url: window.location.pathname,
          fid: metric.value,
        });
      });
    });
  }
}

/**
 * Auto-initialize on page load
 */
if (typeof window !== 'undefined') {
  // Wait for page to be fully loaded
  if (document.readyState === 'complete') {
    initTelemetry();
  } else {
    window.addEventListener('load', initTelemetry);
  }
}


