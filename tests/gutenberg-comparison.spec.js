const { test, expect } = require('@playwright/test');

test.describe('Gutenberg Editor Comparison', () => {
  test('Compare nuCMS editor with WordPress playground', async ({ browser }) => {
    // Create two browser contexts for comparison
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const nuCMSPage = await context1.newPage();
    const wordPressPage = await context2.newPage();
    
    try {
      // Load nuCMS admin
      await nuCMSPage.goto('http://localhost:3000/login');
      await nuCMSPage.fill('input[name="username"]', 'admin');
      await nuCMSPage.fill('input[name="password"]', 'admin123');
      await nuCMSPage.click('button[type="submit"]');
      await nuCMSPage.waitForURL('http://localhost:3000/');
      
      // Navigate to post editor
      await nuCMSPage.click('text=Posts');
      await nuCMSPage.click('text=Create New Post');
      await nuCMSPage.waitForTimeout(2000); // Wait for editor to load
      
      // Take screenshot of nuCMS editor
      await nuCMSPage.screenshot({ 
        path: 'tests/screenshots/nucms-editor.png',
        fullPage: true
      });
      
      // Load WordPress playground
      await wordPressPage.goto('https://playground.wordpress.net');
      await wordPressPage.waitForTimeout(5000); // Wait for playground to load
      
      // Click "Edit Site" to get to Gutenberg editor
      const editSiteButton = wordPressPage.locator('text=Edit Site').first();
      if (await editSiteButton.isVisible()) {
        await editSiteButton.click();
        await wordPressPage.waitForTimeout(3000);
      }
      
      // Take screenshot of WordPress playground editor
      await wordPressPage.screenshot({ 
        path: 'tests/screenshots/wordpress-playground-editor.png',
        fullPage: true
      });
      
      // Test basic editor functionality in nuCMS
      await nuCMSPage.bringToFront();
      
      // Test title input
      const titleInput = nuCMSPage.locator('.edit-post-post-title__input');
      await expect(titleInput).toBeVisible();
      await titleInput.fill('Test Post Title');
      
      // Test adding content blocks
      const blockList = nuCMSPage.locator('.block-editor-block-list__layout');
      await expect(blockList).toBeVisible();
      
      // Try to add content to the first paragraph block
      const paragraphBlock = nuCMSPage.locator('[data-type="core/paragraph"]').first();
      if (await paragraphBlock.isVisible()) {
        await paragraphBlock.click();
        await nuCMSPage.keyboard.type('This is a test paragraph in the Gutenberg editor.');
      }
      
      // Test inserter button
      const inserterButton = nuCMSPage.locator('.block-editor-inserter__toggle');
      await expect(inserterButton).toBeVisible();
      await inserterButton.click();
      await nuCMSPage.waitForTimeout(1000);
      
      // Take screenshot after interaction
      await nuCMSPage.screenshot({ 
        path: 'tests/screenshots/nucms-editor-with-content.png',
        fullPage: true
      });
      
      // Test settings sidebar
      const settingsButton = nuCMSPage.locator('button[aria-label="Settings"]');
      if (await settingsButton.isVisible()) {
        await settingsButton.click();
        await nuCMSPage.waitForTimeout(500);
        
        // Take screenshot with sidebar open
        await nuCMSPage.screenshot({ 
          path: 'tests/screenshots/nucms-editor-with-sidebar.png',
          fullPage: true
        });
      }
      
      console.log('✅ Screenshots captured for comparison');
      console.log('📁 Check tests/screenshots/ for visual comparison files');
      
    } catch (error) {
      console.error('❌ Test failed:', error);
      throw error;
    } finally {
      await context1.close();
      await context2.close();
    }
  });
});