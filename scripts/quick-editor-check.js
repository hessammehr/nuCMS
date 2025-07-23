const { chromium } = require('playwright');

async function quickEditorCheck() {
  console.log('🚀 Quick editor check...');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 }
  });
  
  try {
    // Go to login
    console.log('🏠 Loading login page...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'screenshots/quick-login.png' });
    
    // Login
    console.log('🔐 Logging in...');
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/quick-dashboard.png' });
    
    // Go to new post
    console.log('📝 Opening post editor...');
    await page.goto('http://localhost:3000/posts/new', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000); // Give editor time to load
    await page.screenshot({ path: 'screenshots/quick-editor.png', fullPage: true });
    
    // Check for key elements
    const titleExists = await page.locator('.wp-block-post-title').count() > 0;
    const editorExists = await page.locator('.block-editor-writing-flow').count() > 0;
    const toolbarExists = await page.locator('.edit-post-header-toolbar').count() > 0;
    
    console.log('📊 Editor elements check:');
    console.log('  Title field:', titleExists ? '✅' : '❌');
    console.log('  Editor area:', editorExists ? '✅' : '❌');
    console.log('  Toolbar:', toolbarExists ? '✅' : '❌');
    
    // Try adding content
    if (titleExists) {
      await page.click('.wp-block-post-title');
      await page.fill('.wp-block-post-title', 'Quick Test Post');
    }
    
    if (editorExists) {
      await page.click('.block-editor-writing-flow');
      await page.keyboard.type('Test content for the editor.');
    }
    
    await page.screenshot({ path: 'screenshots/quick-editor-with-content.png', fullPage: true });
    
    console.log('✅ Quick check completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: 'screenshots/quick-error.png' });
  } finally {
    await browser.close();
  }
}

quickEditorCheck().catch(console.error);