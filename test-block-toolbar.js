const { chromium } = require('playwright');

async function testBlockToolbar() {
  const browser = await chromium.launch({ headless: false });
  
  try {
    console.log('🧪 Testing block toolbar appearance and behavior vs Gutenberg...');

    // Create two contexts/pages to compare side by side
    const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    const nuCMSPage = await context.newPage();
    
    // Test nuCMS first
    console.log('📱 Testing nuCMS block toolbar...');
    
    // Login to nuCMS
    await nuCMSPage.goto('http://localhost:3000/login');
    await nuCMSPage.fill('input[name="username"]', 'admin');
    await nuCMSPage.fill('input[name="password"]', 'admin123');
    await nuCMSPage.click('button[type="submit"]');
    await nuCMSPage.waitForURL('http://localhost:3000/');

    // Go to create new post
    await nuCMSPage.goto('http://localhost:3000/posts/new');
    await nuCMSPage.waitForLoadState('networkidle');

    // Add a title
    await nuCMSPage.fill('.edit-post-post-title__input', 'Block Toolbar Test');
    
    // Click in the editor to add content
    await nuCMSPage.click('.block-editor-writing-flow');
    await nuCMSPage.keyboard.type('Test paragraph for block toolbar testing.');

    console.log('🔍 Testing nuCMS block selection and toolbar visibility...');
    
    // Select the paragraph block
    await nuCMSPage.click('.wp-block-paragraph');
    await nuCMSPage.waitForTimeout(1000);

    // Check if block toolbar is visible
    const nuCMSToolbarVisible = await nuCMSPage.locator('.block-editor-block-toolbar').isVisible();
    console.log(`📊 nuCMS block toolbar visible: ${nuCMSToolbarVisible}`);

    if (nuCMSToolbarVisible) {
      // Get toolbar position and size
      const nuCMSToolbarBox = await nuCMSPage.locator('.block-editor-block-toolbar').boundingBox();
      console.log('📐 nuCMS toolbar position:', nuCMSToolbarBox);

      // Check toolbar contents
      const nuCMSToolbarButtons = await nuCMSPage.locator('.block-editor-block-toolbar button').count();
      console.log(`🔘 nuCMS toolbar button count: ${nuCMSToolbarButtons}`);

      // Get button labels/titles
      const nuCMSButtonTitles = await nuCMSPage.locator('.block-editor-block-toolbar button').allInnerTexts();
      console.log('🏷️ nuCMS toolbar button texts:', nuCMSButtonTitles);
    }

    // Take screenshot of nuCMS toolbar
    await nuCMSPage.screenshot({ path: 'nucms-block-toolbar.png' });

    // Now test with WordPress Playground for comparison
    console.log('🌐 Testing WordPress Playground block toolbar...');
    
    const wpPage = await context.newPage();
    await wpPage.goto('https://playground.wordpress.net');
    
    // Wait for playground to load and click "Edit Site"
    await wpPage.waitForTimeout(5000);
    
    try {
      // Look for "Edit Site" button
      const editSiteButton = wpPage.locator('text="Edit Site"').first();
      if (await editSiteButton.isVisible({ timeout: 10000 })) {
        await editSiteButton.click();
        await wpPage.waitForTimeout(3000);
        console.log('✅ Clicked Edit Site button');
      } else {
        // Try alternative selectors
        const altButton = wpPage.locator('[aria-label="Edit site"]').first();
        if (await altButton.isVisible({ timeout: 5000 })) {
          await altButton.click();
          await wpPage.waitForTimeout(3000);
        } else {
          console.log('⚠️ Could not find Edit Site button, trying direct editor access');
          await wpPage.goto('https://playground.wordpress.net/wp-admin/site-editor.php');
          await wpPage.waitForTimeout(3000);
        }
      }

      // Wait for Gutenberg editor to load
      await wpPage.waitForSelector('.block-editor-writing-flow', { timeout: 15000 });
      
      // Add content to test block toolbar
      await wpPage.click('.block-editor-writing-flow');
      await wpPage.keyboard.type('Test paragraph for block toolbar comparison.');
      
      // Select the paragraph block
      await wpPage.click('.wp-block-paragraph');
      await wpPage.waitForTimeout(1000);

      // Check if block toolbar is visible
      const wpToolbarVisible = await wpPage.locator('.block-editor-block-toolbar').isVisible();
      console.log(`📊 WordPress block toolbar visible: ${wpToolbarVisible}`);

      if (wpToolbarVisible) {
        // Get toolbar position and size
        const wpToolbarBox = await wpPage.locator('.block-editor-block-toolbar').boundingBox();
        console.log('📐 WordPress toolbar position:', wpToolbarBox);

        // Check toolbar contents
        const wpToolbarButtons = await wpPage.locator('.block-editor-block-toolbar button').count();
        console.log(`🔘 WordPress toolbar button count: ${wpToolbarButtons}`);

        // Get button labels/titles
        const wpButtonTitles = await wpPage.locator('.block-editor-block-toolbar button').allInnerTexts();
        console.log('🏷️ WordPress toolbar button texts:', wpButtonTitles);
      }

      // Take screenshot of WordPress toolbar
      await wpPage.screenshot({ path: 'wordpress-block-toolbar.png' });

    } catch (wpError) {
      console.log('⚠️ WordPress Playground test failed:', wpError.message);
      await wpPage.screenshot({ path: 'wordpress-error.png' });
    }

    console.log('📋 Block toolbar comparison complete. Check screenshots for visual differences.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testBlockToolbar();