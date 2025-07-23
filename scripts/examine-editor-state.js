const { chromium } = require('playwright');

async function examineEditorState() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  
  // Create two pages for comparison
  const nuCMSPage = await context.newPage();
  const gutenbergPage = await context.newPage();

  try {
    // Test nuCMS
    console.log('🔍 Examining nuCMS editor state...');
    await nuCMSPage.goto('http://localhost:3000');
    await nuCMSPage.waitForTimeout(2000);

    // Login to nuCMS
    try {
      await nuCMSPage.fill('input[name="username"]', 'admin');
      await nuCMSPage.fill('input[name="password"]', 'admin123');
      await nuCMSPage.click('button[type="submit"]');
      await nuCMSPage.waitForTimeout(2000);
      console.log('✅ Logged into nuCMS');
    } catch (e) {
      console.log('ℹ️  Already logged in or login form not found');
    }

    // Navigate to post editor
    await nuCMSPage.click('text=Posts');
    await nuCMSPage.waitForTimeout(1000);
    await nuCMSPage.click('text=New Post');
    await nuCMSPage.waitForTimeout(3000);

    // Test Gutenberg benchmark
    console.log('🔍 Opening Gutenberg benchmark...');
    await gutenbergPage.goto('https://wordpress.org/gutenberg/');
    await gutenbergPage.waitForTimeout(3000);

    // Take comparison screenshots
    console.log('📸 Taking comparison screenshots...');
    await nuCMSPage.screenshot({ 
      path: '/Users/hessammehr/Code/nu_cms/screenshots/nucms-current-state.png', 
      fullPage: true 
    });
    
    await gutenbergPage.screenshot({ 
      path: '/Users/hessammehr/Code/nu_cms/screenshots/gutenberg-benchmark.png', 
      fullPage: true 
    });

    // Test key functionality in nuCMS
    console.log('🧪 Testing nuCMS editor functionality...');
    
    // Test sidebar functionality
    const settingsButton = await nuCMSPage.$('[aria-label="Settings"]');
    if (settingsButton) {
      console.log('✅ Settings button found');
      await settingsButton.click();
      await nuCMSPage.waitForTimeout(500);
      
      // Test document tab
      await nuCMSPage.click('text=Document');
      await nuCMSPage.waitForTimeout(500);
      const docStats = await nuCMSPage.$('.document-inspector-stats');
      if (docStats) {
        console.log('✅ Document inspector working');
      } else {
        console.log('❌ Document inspector not working');
      }
      
      // Test block tab
      await nuCMSPage.click('text=Block');
      await nuCMSPage.waitForTimeout(500);
      console.log('✅ Block tab accessible');
    } else {
      console.log('❌ Settings button not found');
    }

    // Test inserter
    const inserterButton = await nuCMSPage.$('.edit-post-header__inserter');
    if (inserterButton) {
      console.log('✅ Inserter button found');
    } else {
      console.log('❌ Inserter button not found');
    }

    // Test title editing
    const titleArea = await nuCMSPage.$('textarea[placeholder="Add title"]');
    if (titleArea) {
      console.log('✅ Title area found');
      await titleArea.fill('Test Post Title');
      await nuCMSPage.waitForTimeout(500);
    } else {
      console.log('❌ Title area not found');
    }

    // Test content editing
    try {
      const contentArea = await nuCMSPage.$('[data-title="Type / to choose a block"]');
      if (contentArea) {
        console.log('✅ Content area found');
        await contentArea.click();
        await contentArea.fill('This is test content to verify the editor is working properly.');
        await nuCMSPage.waitForTimeout(500);
      } else {
        console.log('❌ Content area not found');
      }
    } catch (e) {
      console.log('⚠️  Could not interact with content area');
    }

    // Test save functionality
    const saveButton = await nuCMSPage.$('button:has-text("Save Draft")');
    if (saveButton) {
      console.log('✅ Save button found');
    } else {
      console.log('❌ Save button not found');
    }

    // Take final screenshot with content
    await nuCMSPage.screenshot({ 
      path: '/Users/hessammehr/Code/nu_cms/screenshots/nucms-with-content.png', 
      fullPage: true 
    });

    console.log('📊 Editor state examination complete!');
    console.log('📁 Screenshots saved to screenshots/ directory');

    await nuCMSPage.waitForTimeout(3000);
    
  } catch (error) {
    console.error('❌ Error during examination:', error);
  } finally {
    await browser.close();
  }
}

examineEditorState().catch(console.error);