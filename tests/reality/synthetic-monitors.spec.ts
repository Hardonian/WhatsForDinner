// @ts-nocheck
/**
 * Reality Suite - E2E tests with synthetic monitors
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Synthetic monitor test - hits prod endpoints hourly
test.describe('Synthetic Monitors', () => {
  const prodUrl = process.env.PROD_URL || 'https://whats-for-dinner.vercel.app';

  test('Health check endpoint', async ({ request }) => {
    const response = await request.get(`${prodUrl}/api/health`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('status', 'ok');
  });

  test('API readiness', async ({ request }) => {
    const response = await request.get(`${prodUrl}/api`);
    expect(response.status()).toBeLessThan(500);
  });

  test('Supabase connectivity', async ({ request }) => {
    // Test Supabase connection through API
    const response = await request.get(`${prodUrl}/api/health`);
    expect(response.status()).toBe(200);
  });
});

// Contract tests
test.describe('Contract Tests', () => {
  test('Supabase contract', async ({ request }) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      test.skip();
      return;
    }

    // Test Supabase REST API contract
    const response = await request.get(`${supabaseUrl}/rest/v1/`, {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      },
    });
    expect(response.status()).toBeLessThan(500);
  });

  test('Webhook contract validation', async ({ request }) => {
    // Test webhook endpoint contract
    const webhookUrl = process.env.WEBHOOK_URL || `${process.env.PROD_URL}/api/webhooks/stripe`;
    const response = await request.post(webhookUrl, {
      data: {
        type: 'test',
        data: {},
      },
    });
    // Should accept or reject with proper error
    expect([200, 400, 401]).toContain(response.status());
  });
});

// TikTok/Meta API stubs
test.describe('Partner API Stubs', () => {
  test('TikTok API stub', async ({ request }) => {
    // Stub TikTok API calls
    const stubUrl = process.env.TIKTOK_STUB_URL || 'http://localhost:3000/api/stubs/tiktok';
    const response = await request.post(stubUrl, {
      data: {
        action: 'test',
      },
    });
    expect(response.status()).toBeLessThan(500);
  });

  test('Meta API stub', async ({ request }) => {
    // Stub Meta API calls
    const stubUrl = process.env.META_STUB_URL || 'http://localhost:3000/api/stubs/meta';
    const response = await request.post(stubUrl, {
      data: {
        action: 'test',
      },
    });
    expect(response.status()).toBeLessThan(500);
  });
});

// Failure notification helper
export async function notifyFailure(testName: string, error: Error) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error(`Test failed: ${testName}`, error);
    return;
  }

  const message = {
    text: `❌ Test Failure: ${testName}`,
    error: error.message,
    timestamp: new Date().toISOString(),
  };

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
  } catch (err) {
    console.error('Failed to send notification:', err);
  }
}
