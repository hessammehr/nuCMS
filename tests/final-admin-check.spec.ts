import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Final Admin Interface Check', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/`);
  });

  test('should demonstrate consistent admin interface across all pages', async ({ page }) => {
    // Take screenshot of dashboard
    await page.goto(`${BASE_URL}/`);
    await page.screenshot({ path: 'tests/screenshots/final-dashboard.png', fullPage: true });
    
    // Take screenshot of posts page
    await page.goto(`${BASE_URL}/posts`);
    await page.screenshot({ path: 'tests/screenshots/final-posts.png', fullPage: true });
    
    // Take screenshot of pages page
    await page.goto(`${BASE_URL}/pages`);
    await page.screenshot({ path: 'tests/screenshots/final-pages.png', fullPage: true });
    
    // Take screenshot of media page
    await page.goto(`${BASE_URL}/media`);
    await page.screenshot({ path: 'tests/screenshots/final-media.png', fullPage: true });
    
    // Verify all pages have consistent styling
    for (const pagePath of ['/', '/posts', '/pages', '/media']) {
      await page.goto(`${BASE_URL}${pagePath}`);
      
      // Check admin bar is consistent
      await expect(page.locator('.wp-admin-bar')).toBeVisible();
      
      // Check main content area has proper background
      const mainContent = page.locator('.main-content');
      await expect(mainContent).toBeVisible();
      await expect(mainContent).toHaveCSS('background', /rgb\(240, 240, 241\)/);
    }
    
    console.log('✅ All admin pages have consistent Gutenberg-style interface');
  });
});