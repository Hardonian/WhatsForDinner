import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveHealthCheckUrl, validateHealthCheckUrl } from './uptime-monitor.mjs';

test('builds the readiness URL from a Vercel domain', () => {
  assert.equal(
    resolveHealthCheckUrl({ VERCEL_PROJECT_DOMAIN: 'example.vercel.app' }),
    'https://example.vercel.app/api/health/ready',
  );
});

test('uses an explicit validated health URL', () => {
  assert.equal(
    resolveHealthCheckUrl({ HEALTH_CHECK_URL: 'https://example.com/api/health/ready' }),
    'https://example.com/api/health/ready',
  );
});

test('rejects unresolved workflow interpolation', () => {
  assert.throws(
    () => validateHealthCheckUrl('https://${{ secrets.VERCEL_PROJECT_DOMAIN }}/api/health'),
    /unresolved or placeholder/,
  );
});

test('rejects non-TLS remote endpoints', () => {
  assert.throws(
    () => validateHealthCheckUrl('http://example.com/api/health'),
    /must use HTTPS/,
  );
});

test('fails when no health target is configured', () => {
  assert.throws(
    () => resolveHealthCheckUrl({}),
    /Set HEALTH_CHECK_URL/,
  );
});
