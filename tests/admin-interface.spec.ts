import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Admin Interface', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/`);
  });

  test('should navigate to dashboard and show stats', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    
    // Check if dashboard title is visible
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
    
    // Check if stat cards are visible
    await expect(page.locator('.wp-stat-card')).toHaveCount(3);
    await expect(page.locator('.wp-stat-card:has-text("Posts")')).toBeVisible();
    await expect(page.locator('.wp-stat-card:has-text("Pages")')).toBeVisible();
    await expect(page.locator('.wp-stat-card:has-text("Media Files")')).toBeVisible();
  });

  test('should navigate to posts page with Gutenberg design', async ({ page }) => {
    await page.goto(`${BASE_URL}/posts`);
    
    // Check if posts page uses new design
    await expect(page.locator('.wp-admin-page')).toBeVisible();
    await expect(page.locator('.wp-admin-page__title:has-text("Posts")')).toBeVisible();
    
    // Check if filters card is visible
    await expect(page.locator('.wp-admin-filters')).toBeVisible();
    
    // Check if create button is styled correctly
    await expect(page.locator('a:has-text("Create New Post")')).toHaveClass(/components-button/);
    await expect(page.locator('a:has-text("Create New Post")')).toHaveClass(/is-primary/);
  });

  test('should navigate to pages page with Gutenberg design', async ({ page }) => {
    await page.goto(`${BASE_URL}/pages`);
    
    // Check if pages page uses new design
    await expect(page.locator('.wp-admin-page')).toBeVisible();
    await expect(page.locator('.wp-admin-page__title:has-text("Pages")')).toBeVisible();
    
    // Check if filters card is visible
    await expect(page.locator('.wp-admin-filters')).toBeVisible();
    
    // Check if create button is styled correctly
    await expect(page.locator('a:has-text("Create New Page")')).toHaveClass(/components-button/);
    await expect(page.locator('a:has-text("Create New Page")')).toHaveClass(/is-primary/);
  });

  test('should navigate to media page with Gutenberg design', async ({ page }) => {
    await page.goto(`${BASE_URL}/media`);
    
    // Check if media page uses new design
    await expect(page.locator('.wp-admin-page')).toBeVisible();
    await expect(page.locator('.wp-admin-page__title:has-text("Media Library")')).toBeVisible();
    
    // Check if filters card is visible
    await expect(page.locator('.wp-admin-filters')).toBeVisible();
    
    // Check if upload button is styled correctly
    await expect(page.locator('button:has-text("Upload Files")')).toHaveClass(/components-button/);
  });

  test('should have consistent admin bar across all pages', async ({ page }) => {
    const pages = ['/', '/posts', '/pages', '/media'];
    
    for (const pagePath of pages) {
      await page.goto(`${BASE_URL}${pagePath}`);
      
      // Check admin bar is present
      await expect(page.locator('.wp-admin-bar')).toBeVisible();
      
      // Check logo is present
      await expect(page.locator('.wp-admin-bar__logo')).toBeVisible();
      
      // Check navigation items
      await expect(page.locator('.wp-admin-bar__nav-item:has-text("Dashboard")')).toBeVisible();
      await expect(page.locator('.wp-admin-bar__nav-item:has-text("Posts")')).toBeVisible();
      await expect(page.locator('.wp-admin-bar__nav-item:has-text("Pages")')).toBeVisible();
      await expect(page.locator('.wp-admin-bar__nav-item:has-text("Media")')).toBeVisible();
    }
  });

  test('should show search and filter controls on list pages', async ({ page }) => {
    const listPages = ['/posts', '/pages', '/media'];
    
    for (const pagePath of listPages) {
      await page.goto(`${BASE_URL}${pagePath}`);
      
      // Check search control is present
      await expect(page.locator('.components-search-control')).toBeVisible();
      
      // Check select control for filtering is present
      await expect(page.locator('.components-select-control')).toBeVisible();
    }
  });
});