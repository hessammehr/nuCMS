const { chromium } = require('playwright');

async function testNucmsEditor() {
  console.log('🚀 Starting nuCMS editor test...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 }
  });
  
  try {
    console.log('🏠 Loading nuCMS login page...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of login
    await page.screenshot({ 
      path: 'screenshots/nucms-login.png',
      fullPage: true
    });
    
    // Login
    console.log('🔐 Logging in...');
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    
    // Navigate to new post
    console.log('📝 Opening post editor...');
    await page.goto('http://localhost:3000/posts/new');
    await page.waitForLoadState('networkidle');
    
    // Wait a bit for editor to initialize
    await page.waitForTimeout(3000);
    
    // Take screenshot of initial editor
    await page.screenshot({ 
      path: 'screenshots/nucms-editor-initial.png',
      fullPage: true
    });
    
    // Test if we can find key editor elements
    const titleField = await page.locator('.wp-block-post-title').first();
    const editorArea = await page.locator('.block-editor-writing-flow').first();
    
    console.log('🔍 Checking editor elements...');
    console.log('Title field visible:', await titleField.isVisible());
    console.log('Editor area visible:', await editorArea.isVisible());
    
    if (await titleField.isVisible()) {
      console.log('✏️ Testing title input...');
      await titleField.click();
      await titleField.fill('Test Post Title');
    }
    
    if (await editorArea.isVisible()) {
      console.log('✏️ Testing content input...');
      await editorArea.click();
      await page.keyboard.type('This is test content for the editor.');
      await page.keyboard.press('Enter');
      await page.keyboard.type('Adding another paragraph.');
    }
    
    // Take screenshot after adding content
    await page.screenshot({ 
      path: 'screenshots/nucms-editor-with-content.png',
      fullPage: true
    });
    
    console.log('✅ Test completed! Screenshots saved.');
    console.log('Browser will stay open for inspection. Press Ctrl+C to exit.');
    
    // Keep browser open for inspection
    await new Promise(() => {});
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ 
      path: 'screenshots/nucms-error.png',
      fullPage: true
    });
  }
}

testNucmsEditor().catch(console.error);