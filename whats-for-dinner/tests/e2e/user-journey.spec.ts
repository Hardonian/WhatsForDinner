// @ts-nocheck
import { test, expect } from '@playwright/test';

// End-to-end test suite for complete user journeys
test.describe('User Journey Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app before each test
    await page.goto('http://localhost:3000');
  });

  test.describe('Recipe Generation Flow', () => {
    test('should complete full recipe generation journey', async ({ page }) => {
      // Wait for page to load
      await expect(page.locator('h1')).toContainText("What's for Dinner?");

      // Fill in ingredients
      await page.fill('[data-testid="ingredients-input"]', 'chicken, rice, vegetables');
      
      // Add preferences
      await page.fill('[data-testid="preferences-input"]', 'healthy and quick');

      // Click generate button
      await page.click('[data-testid="generate-recipes-button"]');

      // Wait for loading state
      await expect(page.locator('[data-testid="loading-skeleton"]')).toBeVisible();

      // Wait for recipes to appear
      await expect(page.locator('[data-testid="recipe-card"]')).toBeVisible({ timeout: 10000 });

      // Verify recipe content
      const recipeCards = page.locator('[data-testid="recipe-card"]');
      await expect(recipeCards).toHaveCount(3); // Should generate 3 recipes

      // Check first recipe has expected content
      const firstRecipe = recipeCards.first();
      await expect(firstRecipe.locator('h3')).toContainText('Recipe');
      await expect(firstRecipe.locator('[data-testid="ingredients"]')).toBeVisible();
      await expect(firstRecipe.locator('[data-testid="cook-time"]')).toBeVisible();
    });

    test('should handle empty ingredients gracefully', async ({ page }) => {
      // Try to generate with empty ingredients
      await page.click('[data-testid="generate-recipes-button"]');

      // Should show validation error
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Please enter at least one ingredient');
    });

    test('should show error state when API fails', async ({ page }) => {
      // Mock API failure
      await page.route('**/api/recipes/generate', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'API Error' }),
        });
      });

      await page.fill('[data-testid="ingredients-input"]', 'chicken');
      await page.click('[data-testid="generate-recipes-button"]');

      // Should show error state
      await expect(page.locator('[data-testid="error-state"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('API Error');
    });
  });

  test.describe('Authentication Flow', () => {
    test('should sign in successfully', async ({ page }) => {
      // Click sign in button
      await page.click('[data-testid="sign-in-button"]');

      // Fill in credentials
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'password123');

      // Submit form
      await page.click('[data-testid="sign-in-submit"]');

      // Should redirect to home page
      await expect(page).toHaveURL('/');
      
      // Should show user menu
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    });

    test('should handle invalid credentials', async ({ page }) => {
      await page.click('[data-testid="sign-in-button"]');
      
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'wrongpassword');
      await page.click('[data-testid="sign-in-submit"]');

      // Should show error message
      await expect(page.locator('[data-testid="auth-error"]')).toContainText('Invalid credentials');
    });

    test('should sign out successfully', async ({ page }) => {
      // First sign in
      await page.click('[data-testid="sign-in-button"]');
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.click('[data-testid="sign-in-submit"]');

      // Wait for sign in to complete
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();

      // Sign out
      await page.click('[data-testid="sign-out-button"]');

      // Should redirect to home page and show sign in button
      await expect(page).toHaveURL('/');
      await expect(page.locator('[data-testid="sign-in-button"]')).toBeVisible();
    });
  });

  test.describe('Pantry Management Flow', () => {
    test('should add and manage pantry items', async ({ page }) => {
      // Navigate to pantry page
      await page.click('[data-testid="pantry-nav-link"]');
      await expect(page).toHaveURL('/pantry');

      // Add new ingredient
      await page.fill('[data-testid="add-ingredient-input"]', 'chicken');
      await page.fill('[data-testid="add-quantity-input"]', '2');
      await page.selectOption('[data-testid="add-unit-select"]', 'pieces');
      await page.click('[data-testid="add-ingredient-button"]');

      // Should appear in pantry list
      await expect(page.locator('[data-testid="pantry-item"]')).toContainText('chicken');
      await expect(page.locator('[data-testid="pantry-item"]')).toContainText('2 pieces');

      // Edit ingredient
      await page.click('[data-testid="edit-ingredient-button"]');
      await page.fill('[data-testid="edit-quantity-input"]', '3');
      await page.click('[data-testid="save-edit-button"]');

      // Should update quantity
      await expect(page.locator('[data-testid="pantry-item"]')).toContainText('3 pieces');

      // Delete ingredient
      await page.click('[data-testid="delete-ingredient-button"]');
      await page.click('[data-testid="confirm-delete-button"]');

      // Should remove from list
      await expect(page.locator('[data-testid="pantry-item"]')).not.toBeVisible();
    });
  });

  test.describe('Favorites Flow', () => {
    test('should save and manage favorite recipes', async ({ page }) => {
      // First generate some recipes
      await page.fill('[data-testid="ingredients-input"]', 'chicken, rice');
      await page.click('[data-testid="generate-recipes-button"]');
      await expect(page.locator('[data-testid="recipe-card"]')).toBeVisible({ timeout: 10000 });

      // Save first recipe to favorites
      await page.click('[data-testid="save-recipe-button"]');
      await expect(page.locator('[data-testid="save-success-message"]')).toBeVisible();

      // Navigate to favorites page
      await page.click('[data-testid="favorites-nav-link"]');
      await expect(page).toHaveURL('/favorites');

      // Should show saved recipe
      await expect(page.locator('[data-testid="favorite-recipe"]')).toBeVisible();
      await expect(page.locator('[data-testid="favorite-recipe"]')).toContainText('Recipe');

      // Remove from favorites
      await page.click('[data-testid="remove-favorite-button"]');
      await page.click('[data-testid="confirm-remove-button"]');

      // Should remove from favorites list
      await expect(page.locator('[data-testid="favorite-recipe"]')).not.toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Should show mobile menu
      await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();

      // Open mobile menu
      await page.click('[data-testid="mobile-menu-button"]');
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();

      // Test mobile navigation
      await page.click('[data-testid="mobile-pantry-link"]');
      await expect(page).toHaveURL('/pantry');
    });

    test('should work on tablet devices', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });

      // Should show desktop navigation
      await expect(page.locator('[data-testid="desktop-nav"]')).toBeVisible();
      await expect(page.locator('[data-testid="mobile-menu-button"]')).not.toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      // Tab through main elements
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toBeVisible();

      // Should be able to navigate with keyboard
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');

      // Should activate focused element
      await expect(page.locator('[data-testid="ingredients-input"]')).toBeFocused();
    });

    test('should have proper ARIA labels', async ({ page }) => {
      // Check for ARIA labels on interactive elements
      await expect(page.locator('[data-testid="generate-recipes-button"]')).toHaveAttribute('aria-label');
      await expect(page.locator('[data-testid="ingredients-input"]')).toHaveAttribute('aria-label');
      
      // Check for proper heading structure
      const headings = page.locator('h1, h2, h3, h4, h5, h6');
      await expect(headings.first()).toHaveText("What's for Dinner?");
    });
  });

  test.describe('Performance', () => {
    test('should load within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('http://localhost:3000');
      await expect(page.locator('h1')).toContainText("What's for Dinner?");
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds
    });

    test('should handle large ingredient lists efficiently', async ({ page }) => {
      const largeIngredientList = Array(50).fill(null).map((_, i) => `ingredient${i}`).join(', ');
      
      const startTime = Date.now();
      
      await page.fill('[data-testid="ingredients-input"]', largeIngredientList);
      await page.click('[data-testid="generate-recipes-button"]');
      await expect(page.locator('[data-testid="recipe-card"]')).toBeVisible({ timeout: 15000 });
      
      const processingTime = Date.now() - startTime;
      expect(processingTime).toBeLessThan(10000); // Should process within 10 seconds
    });
  });

  test.describe('Error Recovery', () => {
    test('should recover from network errors', async ({ page }) => {
      // Start generating recipes
      await page.fill('[data-testid="ingredients-input"]', 'chicken');
      await page.click('[data-testid="generate-recipes-button"]');

      // Simulate network error
      await page.route('**/api/recipes/generate', route => {
        route.abort('failed');
      });

      // Should show error state
      await expect(page.locator('[data-testid="error-state"]')).toBeVisible();

      // Restore network and retry
      await page.unroute('**/api/recipes/generate');
      await page.click('[data-testid="retry-button"]');

      // Should successfully generate recipes
      await expect(page.locator('[data-testid="recipe-card"]')).toBeVisible({ timeout: 10000 });
    });
  });
});