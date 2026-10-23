import { expect, test } from '@playwright/test';

test.describe('public launch journey and browser security', () => {
  test('serves the marketing page with production security headers', async ({
    page,
  }) => {
    const response = await page.goto('/home');

    expect(response).not.toBeNull();
    expect(response?.status()).toBe(200);
    expect(response?.headers()['x-frame-options']).toBe('DENY');
    expect(response?.headers()['x-content-type-options']).toBe('nosniff');
    expect(response?.headers()['referrer-policy']).toBe(
      'strict-origin-when-cross-origin'
    );
    expect(response?.headers()['content-security-policy']).toContain(
      "frame-ancestors 'none'"
    );
    await expect(
      page.getByRole('heading', { name: /Dinner Plans That Plan Themselves/i })
    ).toBeVisible();
  });

  test('takes a visitor from the landing page into the instant-dinner flow', async ({
    page,
  }) => {
    await page.goto('/home');

    await page.getByRole('link', { name: /Start Instant Dinner/i }).click();

    await expect(page).toHaveURL(/\/onboarding\/?$/);
    await expect(
      page.getByRole('heading', { name: /Dinner, Solved in 30 Seconds/i })
    ).toBeVisible();
  });

  test('completes pantry-to-recipe onboarding when the recipe service is unavailable', async ({
    page,
  }) => {
    await page.route('**/api/**', async (route) => {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'test dependency unavailable' }),
      });
    });

    await page.goto('/onboarding');
    await page.getByRole('button', { name: /Pick My Pantry Items/i }).click();
    await expect(
      page.getByRole('heading', { name: /What's in your kitchen\?/i })
    ).toBeVisible();

    await page
      .getByRole('button', { name: /Continue to Preferences/i })
      .click();
    await expect(
      page.getByRole('heading', { name: /Diet & Cooking Preferences/i })
    ).toBeVisible();

    await page
      .getByRole('button', { name: /Generate My Personalized Dinner/i })
      .click();

    await expect(
      page.getByText('Golden Garlic Herb Skillet with Rice')
    ).toBeVisible();
    await expect(page.getByText('95% Pantry Match')).toBeVisible();
    await expect(page.getByText(/Missing Ingredients \(2\)/i)).toBeVisible();
  });

  test('keeps public legal and availability information reachable', async ({
    page,
  }) => {
    for (const [path, heading] of [
      ['/privacy', 'Privacy Policy'],
      ['/terms', 'Terms of Service'],
      ['/status', 'System Status'],
    ]) {
      const response = await page.goto(path);

      expect(response?.status()).toBe(200);
      await expect(
        page.getByRole('heading', { name: heading, exact: true })
      ).toBeVisible();
    }
  });

  test('exposes public deployment probes with non-cacheable responses', async ({
    request,
  }) => {
    for (const path of [
      '/api/health/live',
      '/api/health/ready',
      '/api/healthz',
    ]) {
      const response = await request.get(path);

      expect(response.status()).toBe(200);
      expect(response.headers()['cache-control']).toContain('no-store');
    }
  });
});
