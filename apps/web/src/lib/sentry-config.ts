// Sentry config — stub when @sentry/nextjs is not installed
export function initSentry() {
  // Sentry not configured — noop
}
export function captureException(error: unknown) {
  console.error('[sentry-stub]', error);
}
