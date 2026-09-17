/**
 * Window type extensions for third-party scripts
 */

interface Window {
  gtag?: (
    command: 'config' | 'event' | 'set' | 'js',
    targetId: string | Date,
    config?: Record<string, unknown>
  ) => void;
  dataLayer?: unknown[];
}
