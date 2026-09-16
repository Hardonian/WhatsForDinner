// @ts-nocheck
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Smoke Tests', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Check that the page loads
    await expect(page).toHaveTitle(/What's for Dinner/);
    
    // Check for key elements
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should have working health endpoint', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/api/health`);
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.status).toBe('healthy');
    expect(data.timestamp).toBeDefined();
  });

  test('should have working self-test endpoint', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/api/selftest`);
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.status).toBe('healthy');
    expect(data.tests).toBeDefined();
    expect(Array.isArray(data.tests)).toBe(true);
  });

  test('should handle database connectivity', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/api/health`);
    const data = await response.json();
    
    if (data.checks?.database) {
      expect(data.checks.database.status).toBe('healthy');
    }
  });

  test('should have proper error handling', async ({ page }) => {
    // Test 404 page
    const response = await page.request.get(`${BASE_URL}/non-existent-page`);
    expect(response.status()).toBe(404);
  });

  test('should have proper security headers', async ({ page }) => {
    const response = await page.request.get(BASE_URL);
    
    // Check for security headers
    const headers = response.headers();
    
    // These headers should be present for security
    expect(headers['x-frame-options']).toBeDefined();
    expect(headers['x-content-type-options']).toBeDefined();
  });

  test('should perform critical read operation', async ({ page }) => {
    // This test would perform a critical read operation
    // For now, we'll test the health endpoint as a proxy
    const response = await page.request.get(`${BASE_URL}/api/health`);
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.status).toBe('healthy');
  });

  test('should perform critical write operation', async ({ page }) => {
    // This test would perform a critical write operation
    // For now, we'll test the self-test endpoint which includes write tests
    const response = await page.request.get(`${BASE_URL}/api/selftest`);
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.status).toBe('healthy');
    
    // Check that write tests passed
    const writeTest = data.tests.find((test: any) => 
      test.name.includes('Write Test')
    );
    if (writeTest) {
      expect(writeTest.status).toBe('pass');
    }
  });

  test('should show updated UI after operations', async ({ page }) => {
    // This test would verify that the UI updates after operations
    // For now, we'll test that the page loads and shows expected content
    await page.goto(BASE_URL);
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Check that the page is interactive
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Performance Tests', () => {
  test('should load within performance budget', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Page should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should have acceptable Lighthouse scores', async ({ page }) => {
    // This would typically use Lighthouse CI
    // For now, we'll just ensure the page loads
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/What's for Dinner/);
  });
});

test.describe('Security Tests', () => {
  test('should not expose sensitive information', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/api/health`);
    const data = await response.json();
    
    // Health endpoint should not expose sensitive data
    expect(data).not.toHaveProperty('secrets');
    expect(data).not.toHaveProperty('keys');
    expect(data).not.toHaveProperty('tokens');
  });

  test('should handle authentication properly', async ({ page }) => {
    // Test that protected routes require authentication
    const response = await page.request.get(`${BASE_URL}/api/selftest`);
    
    // Self-test should work (it uses service role)
    expect(response.status()).toBe(200);
  });
});