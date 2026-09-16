import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('verify-landing-pages');

// Landing page verification script
// Run this to verify all landing pages are accessible

const LANDING_PAGES = [
  '/for-families',
  '/for-churches',
  '/for-wellness',
  '/for-corporate',
  '/for-fitness',
  '/for-seniors',
  '/for-schools',
  '/for-healthcare',
];

/**
 * Verify landing pages are accessible
 * This can be run in browser console or as a test
 */
export async function verifyLandingPages(baseUrl: string = 'http://localhost:3000') {
  const results = [];

  for (const path of LANDING_PAGES) {
    try {
      const response = await fetch(`${baseUrl}${path}`);
      const status = response.status;
      const isOk = status === 200;
      
      results.push({
        path,
        status,
        ok: isOk,
        error: isOk ? null : `HTTP ${status}`,
      });
    } catch (error) {
      results.push({
        path,
        status: null,
        ok: false,
        error: error.message,
      });
    }
  }

  return results;
}

// Usage in browser console:
// import { verifyLandingPages } from '@/lib/verify-landing-pages';
// verifyLandingPages().then(console.log);
