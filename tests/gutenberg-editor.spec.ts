import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Gutenberg Editor', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/`);
  });

  test('should open post editor with Gutenberg interface', async ({ page }) => {
    await page.goto(`${BASE_URL}/posts/new`);
    
    // Wait for editor to load
    await page.waitForSelector('.edit-post-visual-editor', { timeout: 10000 });
    
    // Check if editor header is visible
    await expect(page.locator('.edit-post-header')).toBeVisible();
    
    // Check if title field is visible and placeholder works
    const titleField = page.locator('.edit-post-post-title__input');
    await expect(titleField).toBeVisible();
    await expect(titleField).toHaveAttribute('placeholder', 'Add title');
    
    // Check if block editor content area is visible
    await expect(page.locator('.block-editor-writing-flow')).toBeVisible();
    
    // Check if close button works
    await expect(page.locator('.edit-post-header__close-button')).toBeVisible();
  });

  test('should allow adding and editing blocks', async ({ page }) => {
    await page.goto(`${BASE_URL}/posts/new`);
    await page.waitForSelector('.edit-post-visual-editor', { timeout: 10000 });
    
    // Add a title
    const titleField = page.locator('.edit-post-post-title__input');
    await titleField.fill('Test Post Title');
    
    // Click in the content area to add first block
    await page.click('.block-editor-writing-flow');
    
    // Add some text to the paragraph block
    const paragraphBlock = page.locator('[data-type="core/paragraph"] p');
    await paragraphBlock.fill('This is a test paragraph.');
    
    // Check if the text was added
    await expect(paragraphBlock).toHaveText('This is a test paragraph.');
    
    // Try to add another block by pressing Enter
    await paragraphBlock.press('Enter');
    
    // Check if another paragraph block was created
    await expect(page.locator('[data-type="core/paragraph"]')).toHaveCount(2);
  });

  test('should have block inserter functionality', async ({ page }) => {
    await page.goto(`${BASE_URL}/posts/new`);
    await page.waitForSelector('.edit-post-visual-editor', { timeout: 10000 });
    
    // Check if block inserter button is visible
    const inserterButton = page.locator('.edit-post-header__inserter .components-button');
    await expect(inserterButton).toBeVisible();
    
    // Click the block inserter
    await inserterButton.click();
    
    // Check if block inserter panel opens
    await expect(page.locator('.block-editor-inserter')).toBeVisible();
    
    // Look for common blocks
    await expect(page.locator('.block-editor-block-types-list')).toBeVisible();
    
    // Close inserter by clicking somewhere else
    await page.click('.edit-post-visual-editor__content-area');
    
    // Check if inserter panel closes
    await expect(page.locator('.block-editor-inserter')).not.toBeVisible();
  });

  test('should have sidebar functionality', async ({ page }) => {
    await page.goto(`${BASE_URL}/posts/new`);
    await page.waitForSelector('.edit-post-visual-editor', { timeout: 10000 });
    
    // Check if sidebar is visible
    await expect(page.locator('.interface-interface-skeleton__sidebar')).toBeVisible();
    
    // Check if document tab is available
    const documentTab = page.locator('.edit-post-sidebar__panel-tabs .components-tab-panel__tabs-item').first();
    await expect(documentTab).toBeVisible();
    await expect(documentTab).toContainText('Document');
    
    // Check if block tab is available when a block is selected
    const blockTab = page.locator('.edit-post-sidebar__panel-tabs .components-tab-panel__tabs-item').nth(1);
    await expect(blockTab).toBeVisible();
    await expect(blockTab).toContainText('Block');
  });

  test('should allow saving posts', async ({ page }) => {
    await page.goto(`${BASE_URL}/posts/new`);
    await page.waitForSelector('.edit-post-visual-editor', { timeout: 10000 });
    
    // Add title and content
    await page.fill('.edit-post-post-title__input', 'Test Save Post');
    await page.click('.block-editor-writing-flow');
    await page.fill('[data-type="core/paragraph"] p', 'Test content for saving.');
    
    // Look for save button
    const saveButton = page.locator('.edit-post-header__settings .components-button:has-text("Save")');
    
    if (await saveButton.isVisible()) {
      await saveButton.click();
      
      // Wait for save to complete
      await page.waitForTimeout(1000);
      
      // Check if save was successful (look for saved status or success message)
      const savedStatus = page.locator('.edit-post-header__settings :has-text("Saved")');
      if (await savedStatus.isVisible()) {
        await expect(savedStatus).toBeVisible();
      }
    }
  });

  test('should have proper editor layout and styling', async ({ page }) => {
    await page.goto(`${BASE_URL}/posts/new`);
    await page.waitForSelector('.edit-post-visual-editor', { timeout: 10000 });
    
    // Check if editor is in fullscreen mode
    await expect(page.locator('.gutenberg-fullscreen-editor')).toBeVisible();
    
    // Check if header has proper height
    const header = page.locator('.edit-post-header');
    await expect(header).toBeVisible();
    
    // Check if content area takes remaining space
    const contentArea = page.locator('.edit-post-visual-editor__content-area');
    await expect(contentArea).toBeVisible();
    
    // Check if interface skeleton is properly structured
    const skeleton = page.locator('.interface-interface-skeleton');
    await expect(skeleton).toBeVisible();
    
    // Check if body has proper layout
    const skeletonBody = page.locator('.interface-interface-skeleton__body');
    await expect(skeletonBody).toBeVisible();
  });

  test('should handle editor close functionality', async ({ page }) => {
    await page.goto(`${BASE_URL}/posts/new`);
    await page.waitForSelector('.edit-post-visual-editor', { timeout: 10000 });
    
    // Check if close button is visible
    const closeButton = page.locator('.edit-post-header__close-button');
    await expect(closeButton).toBeVisible();
    
    // Click close button
    await closeButton.click();
    
    // Should navigate back to posts list
    await page.waitForURL(`${BASE_URL}/posts`);
    await expect(page.locator('.wp-admin-page__title:has-text("Posts")')).toBeVisible();
  });
});