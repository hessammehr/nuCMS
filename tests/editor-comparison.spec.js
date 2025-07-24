const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Editor Comparison with WordPress Playground', () => {
  test('should compare nuCMS editor with WordPress Playground', async ({ browser }) => {
    // Create two browser contexts for side-by-side comparison
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const nuCMSPage = await context1.newPage();
    const wpPage = await context2.newPage();
    
    try {
      console.log('Setting up WordPress Playground...');
      
      // Navigate to WordPress Playground
      await wpPage.goto('https://playground.wordpress.net', { timeout: 60000 });
      await wpPage.waitForLoadState('networkidle', { timeout: 30000 });
      
      // Wait for and click "Edit Site" button
      try {
        await wpPage.waitForSelector('button:has-text("Edit Site"), a:has-text("Edit Site")', { timeout: 20000 });
        await wpPage.click('button:has-text("Edit Site"), a:has-text("Edit Site")');
        await wpPage.waitForLoadState('networkidle', { timeout: 20000 });
      } catch (e) {
        console.log('Edit Site button not found, looking for alternative navigation...');
        // Try clicking on "Site Editor" or similar
        await wpPage.waitForSelector('text=Site Editor', { timeout: 10000 });
        await wpPage.click('text=Site Editor');
        await wpPage.waitForLoadState('networkidle', { timeout: 20000 });
      }
      
      // Take screenshot of WordPress Playground editor
      await wpPage.screenshot({
        path: path.join(__dirname, 'screenshots', 'wordpress-playground-editor.png'),
        fullPage: true
      });
      console.log('WordPress Playground editor screenshot captured');
      
      console.log('Setting up nuCMS editor...');
      
      // Navigate to nuCMS and login
      await nuCMSPage.goto('http://localhost:3000', { timeout: 30000 });
      await nuCMSPage.fill('input[name="username"]', 'admin');
      await nuCMSPage.fill('input[name="password"]', 'admin123');
      await nuCMSPage.click('button[type="submit"]');
      await nuCMSPage.waitForURL('http://localhost:3000/', { timeout: 10000 });
      
      // Navigate to create new post
      await nuCMSPage.click('a[href="/posts"]');
      await nuCMSPage.waitForURL('http://localhost:3000/posts', { timeout: 10000 });
      await nuCMSPage.click('a:has-text("Create New Post"), button:has-text("Create New Post")');
      await nuCMSPage.waitForLoadState('networkidle', { timeout: 10000 });
      
      // Take screenshot of nuCMS editor
      await nuCMSPage.screenshot({
        path: path.join(__dirname, 'screenshots', 'nucms-editor.png'),
        fullPage: true
      });
      console.log('nuCMS editor screenshot captured');
      
      // Test basic functionality in nuCMS editor
      console.log('Testing nuCMS editor functionality...');
      
      // Add a title
      const titleSelector = 'input[placeholder*="title"], .editor-post-title__input, h1[contenteditable="true"]';
      try {
        await nuCMSPage.waitForSelector(titleSelector, { timeout: 5000 });
        await nuCMSPage.fill(titleSelector, 'Test Post Title from Playwright');
      } catch (e) {
        console.log('Title input not found with expected selectors');
      }
      
      // Try to add a paragraph block
      try {
        await nuCMSPage.waitForSelector('.block-editor-writing-flow, .wp-block-post-content', { timeout: 5000 });
        await nuCMSPage.click('.block-editor-writing-flow, .wp-block-post-content');
        await nuCMSPage.keyboard.type('This is a test paragraph added by Playwright');
      } catch (e) {
        console.log('Could not interact with editor content area');
      }
      
      // Take screenshot after adding content
      await nuCMSPage.screenshot({
        path: path.join(__dirname, 'screenshots', 'nucms-editor-with-content.png'),
        fullPage: true
      });
      console.log('nuCMS editor with content screenshot captured');
      
    } finally {
      await context1.close();
      await context2.close();
    }
  });
  
  test('should test editor block functionality', async ({ page }) => {
    console.log('Testing editor block functionality...');
    
    // Navigate to nuCMS and login
    await page.goto('http://localhost:3000', { timeout: 30000 });
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:3000/', { timeout: 10000 });
    
    // Navigate to create new post
    await page.click('a[href="/posts"]');
    await page.waitForLoadState('networkidle');
    await page.click('a:has-text("Create New Post"), button:has-text("Create New Post")');
    await page.waitForLoadState('networkidle');
    
    // Take initial screenshot
    await page.screenshot({
      path: path.join(__dirname, 'screenshots', 'editor-initial-state.png'),
      fullPage: true
    });
    
    // Test adding different block types
    try {
      // Look for block inserter
      const inserterSelectors = [
        '.block-editor-inserter__toggle',
        '.edit-post-header-toolbar__inserter-toggle',
        'button[aria-label*="Add block"]',
        'button:has-text("+")'
      ];
      
      let inserterFound = false;
      for (const selector of inserterSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 2000 });
          await page.click(selector);
          inserterFound = true;
          console.log(`Found inserter with selector: ${selector}`);
          break;
        } catch (e) {
          continue;
        }
      }
      
      if (inserterFound) {
        // Take screenshot of block inserter
        await page.screenshot({
          path: path.join(__dirname, 'screenshots', 'editor-block-inserter.png'),
          fullPage: true
        });
        console.log('Block inserter screenshot captured');
      }
      
    } catch (e) {
      console.log('Could not find or interact with block inserter');
    }
    
    // Take final screenshot
    await page.screenshot({
      path: path.join(__dirname, 'screenshots', 'editor-final-state.png'),
      fullPage: true
    });
    console.log('Editor functionality test completed');
  });
});