const { test, expect } = require('@playwright/test');

test.describe('Gutenberg Post Editor Comparison', () => {
  test('Compare nuCMS post editor with WordPress post editor', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const nuCMSPage = await context1.newPage();
    const wordPressPage = await context2.newPage();
    
    try {
      // Load nuCMS admin and navigate to post editor
      await nuCMSPage.goto('http://localhost:3000/login');
      await nuCMSPage.fill('input[name="username"]', 'admin');
      await nuCMSPage.fill('input[name="password"]', 'admin123');
      await nuCMSPage.click('button[type="submit"]');
      await nuCMSPage.waitForURL('http://localhost:3000/');
      
      // Navigate to post editor
      await nuCMSPage.click('text=Posts');
      await nuCMSPage.click('text=Create New Post');
      await nuCMSPage.waitForTimeout(3000); // Wait for editor to load
      
      // Take screenshot of nuCMS editor
      await nuCMSPage.screenshot({ 
        path: 'tests/screenshots/nucms-post-editor-full.png',
        fullPage: true
      });
      
      // Load WordPress playground and try to get to post editor
      await wordPressPage.goto('https://playground.wordpress.net');
      await wordPressPage.waitForTimeout(8000); // Wait for playground to load fully
      
      // Try to navigate to WordPress admin dashboard
      try {
        // Look for admin link or wp-admin
        const adminLink = wordPressPage.locator('text=Dashboard').first();
        if (await adminLink.isVisible({ timeout: 5000 })) {
          await adminLink.click();
          await wordPressPage.waitForTimeout(2000);
        } else {
          // Try going directly to wp-admin
          const currentUrl = wordPressPage.url();
          const adminUrl = currentUrl.replace(/\/$/, '') + '/wp-admin/';
          await wordPressPage.goto(adminUrl);
          await wordPressPage.waitForTimeout(3000);
        }
        
        // Try to find and click "Add New Post"
        const addNewPost = wordPressPage.locator('text=Add New Post, text=Posts').first();
        if (await addNewPost.isVisible({ timeout: 5000 })) {
          await addNewPost.click();
          await wordPressPage.waitForTimeout(3000);
        } else {
          // Alternative: try to find Posts menu
          const postsMenu = wordPressPage.locator('text=Posts').first();
          if (await postsMenu.isVisible({ timeout: 5000 })) {
            await postsMenu.click();
            await wordPressPage.waitForTimeout(1000);
            const addNew = wordPressPage.locator('text=Add New').first();
            if (await addNew.isVisible({ timeout: 3000 })) {
              await addNew.click();
              await wordPressPage.waitForTimeout(3000);
            }
          }
        }
      } catch (error) {
        console.log('Could not navigate to WordPress post editor, taking screenshot of current state');
      }
      
      // Take screenshot of WordPress editor (whatever we managed to get to)
      await wordPressPage.screenshot({ 
        path: 'tests/screenshots/wordpress-post-editor-attempt.png',
        fullPage: true
      });
      
      // Switch back to test nuCMS functionality
      await nuCMSPage.bringToFront();
      
      // Test basic editor functionality
      console.log('🧪 Testing nuCMS editor functionality...');
      
      // Test title input
      const titleInput = nuCMSPage.locator('.edit-post-post-title__input');
      await expect(titleInput).toBeVisible();
      await titleInput.fill('Test Post Title for Comparison');
      console.log('✅ Title input works');
      
      // Test content area - click on the main editor area
      const editorArea = nuCMSPage.locator('.block-editor-block-list__layout');
      await expect(editorArea).toBeVisible();
      
      // Try to click and type in the main content area
      const paragraphBlock = nuCMSPage.locator('[data-type="core/paragraph"]').first();
      if (await paragraphBlock.isVisible()) {
        await paragraphBlock.click();
        await paragraphBlock.fill('This is a test paragraph to verify the Gutenberg editor is working properly in nuCMS.');
        console.log('✅ Content editing works');
      } else {
        console.log('⚠️ Could not find paragraph block');
      }
      
      // Test document sidebar functionality
      const documentTab = nuCMSPage.locator('button:has-text("Document")');
      if (await documentTab.isVisible()) {
        await documentTab.click();
        console.log('✅ Document tab works');
      }
      
      const blockTab = nuCMSPage.locator('button:has-text("Block")');
      if (await blockTab.isVisible()) {
        await blockTab.click();
        console.log('✅ Block tab works');
      }
      
      // Test settings functionality
      const slugInput = nuCMSPage.locator('input[value=""]').first();
      if (await slugInput.isVisible()) {
        await slugInput.fill('test-post-slug');
        console.log('✅ Slug input works');
      }
      
      // Take final screenshot with content
      await nuCMSPage.screenshot({ 
        path: 'tests/screenshots/nucms-editor-with-test-content.png',
        fullPage: true
      });
      
      console.log('✅ Screenshots captured for comparison');
      console.log('📁 Check tests/screenshots/ for visual comparison files');
      
    } catch (error) {
      console.error('❌ Test failed:', error);
      // Take error screenshot
      await nuCMSPage.screenshot({ 
        path: 'tests/screenshots/nucms-editor-error.png',
        fullPage: true
      });
      throw error;
    } finally {
      await context1.close();
      await context2.close();
    }
  });
});