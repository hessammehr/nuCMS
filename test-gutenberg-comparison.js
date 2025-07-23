const { chromium } = require('playwright');
const path = require('path');

async function compareGutenbergEditors() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 // Slow down for visual inspection
  });
  
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  // Open two tabs for comparison
  const gutenbergPage = await context.newPage();
  const nucmsPage = await context.newPage();

  try {
    console.log('🔍 Opening Gutenberg benchmark editor...');
    await gutenbergPage.goto('https://wordpress.org/gutenberg/');
    
    console.log('🔍 Opening nuCMS editor...');
    await nucmsPage.goto('http://localhost:3000');
    
    // Login to nuCMS first
    console.log('🔐 Logging into nuCMS...');
    await nucmsPage.fill('input[name="username"]', 'admin');
    await nucmsPage.fill('input[name="password"]', 'admin123');
    await nucmsPage.click('button[type="submit"]');
    
    // Wait for successful login - the app redirects to root path after login
    await nucmsPage.waitForSelector('.main-content', { timeout: 10000 });
    
    // Navigate to create new post
    console.log('📝 Creating new post in nuCMS...');
    await nucmsPage.click('a[href="/posts"]');
    await nucmsPage.waitForURL('**/posts');
    await nucmsPage.click('text=New Post');
    await nucmsPage.waitForURL('**/posts/new');
    
    // Wait for both editors to load
    console.log('⏳ Waiting for editors to load...');
    await Promise.all([
      gutenbergPage.waitForLoadState('networkidle'),
      nucmsPage.waitForSelector('.gutenberg-fullscreen-editor', { timeout: 10000 })
    ]);

    // Take comparison screenshots
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    console.log('📸 Taking comparison screenshots...');
    await gutenbergPage.screenshot({ 
      path: `screenshots/gutenberg-benchmark-${timestamp}.png`,
      fullPage: true 
    });
    
    await nucmsPage.screenshot({ 
      path: `screenshots/nucms-editor-${timestamp}.png`,
      fullPage: true 
    });

    // Test basic functionality in both editors
    console.log('🧪 Testing basic editor functionality...');
    
    // Test 1: Add title
    console.log('  - Testing title input...');
    await nucmsPage.fill('.edit-post-post-title__input', 'Test Post Title');
    
    // Test 2: Add paragraph block and content
    console.log('  - Testing paragraph block...');
    const editorCanvas = nucmsPage.locator('.block-editor-writing-flow').first();
    await editorCanvas.click();
    await nucmsPage.keyboard.type('This is a test paragraph to verify the editor functionality.');
    
    // Test 3: Add heading block
    console.log('  - Testing heading block...');
    await nucmsPage.keyboard.press('Enter');
    await nucmsPage.keyboard.type('/heading');
    await nucmsPage.keyboard.press('Enter');
    await nucmsPage.keyboard.type('This is a test heading');
    
    // Test 4: Test block inserter
    console.log('  - Testing block inserter...');
    const inserterButton = nucmsPage.locator('.components-button.block-editor-inserter__toggle');
    if (await inserterButton.count() > 0) {
      await inserterButton.click();
      await nucmsPage.waitForSelector('.block-editor-inserter__main-area', { timeout: 5000 });
    }
    
    // Take screenshot with content
    await nucmsPage.screenshot({ 
      path: `screenshots/nucms-with-content-${timestamp}.png`,
      fullPage: true 
    });
    
    // Test 5: Test document inspector (sidebar)
    console.log('  - Testing document inspector...');
    const settingsButton = nucmsPage.locator('button[aria-label="Settings"]');
    if (await settingsButton.count() > 0) {
      await settingsButton.click();
      await nucmsPage.screenshot({ 
        path: `screenshots/nucms-with-sidebar-${timestamp}.png`,
        fullPage: true 
      });
    }
    
    // Test 6: Test save functionality
    console.log('  - Testing save functionality...');
    const saveButton = nucmsPage.locator('button:has-text("Save")');
    if (await saveButton.count() > 0) {
      await saveButton.click();
      console.log('    ✅ Save button clicked');
    }

    console.log('🎉 Comparison test completed successfully!');
    console.log(`📁 Screenshots saved with timestamp: ${timestamp}`);
    
    // Keep browsers open for manual inspection
    console.log('🔍 Browsers will remain open for manual inspection...');
    console.log('Press any key to close browsers...');
    
    // Wait for user input (in a real scenario, you might want to remove this)
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });

  } catch (error) {
    console.error('❌ Error during comparison:', error);
    
    // Take error screenshots
    const errorTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await gutenbergPage.screenshot({ 
      path: `screenshots/error-gutenberg-${errorTimestamp}.png` 
    });
    await nucmsPage.screenshot({ 
      path: `screenshots/error-nucms-${errorTimestamp}.png` 
    });
    
    throw error;
  } finally {
    await browser.close();
  }
}

// Check if we can reach the development server
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000');
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }
    return true;
  } catch (error) {
    console.error('❌ Development server is not running at http://localhost:3000');
    console.error('   Please run "make dev" to start the development server');
    return false;
  }
}

async function main() {
  console.log('🚀 Starting Gutenberg Editor Comparison Test');
  
  if (!(await checkServer())) {
    process.exit(1);
  }
  
  await compareGutenbergEditors();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { compareGutenbergEditors };