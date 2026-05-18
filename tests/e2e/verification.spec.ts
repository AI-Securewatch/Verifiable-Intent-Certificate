import { test, expect } from '@playwright/test';

test.describe('PayReality Verification E2E', () => {
  test('should load the page, navigate tabs and trigger simulation', async ({ page }) => {
    await page.goto('/');

    // Check title
    await expect(page).toHaveTitle(/AI SecureWatch \| PayReality/);

    // Verify main heading
    await expect(page.locator('h1', { hasText: 'PayReality' })).toBeVisible();

    // Navigate to AI Simulator tab
    await page.click('text=AI Simulator');
    
    // Verify simulator UI
    await expect(page.locator('h2', { hasText: 'AI Simulator' })).toBeVisible();
    
    // Verify Audit Log tab
    await page.click('text=Audit Log');
    await expect(page.locator('h2', { hasText: 'Audit Log' })).toBeVisible();
  });

  test('should show history queue', async ({ page }) => {
    await page.goto('/history');
    
    // Verify heading
    await expect(page.locator('h1', { hasText: 'Live Payment Queue' })).toBeVisible();
    
    // Navigate back to dashboard
    await page.click('text=← Back to Dashboard');
    await expect(page.locator('h1', { hasText: 'PayReality' })).toBeVisible();
  });
});
