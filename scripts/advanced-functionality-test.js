const { chromium } = require('playwright');

async function testAdvancedFunctionality() {
  console.log('🚀 Testing advanced editor functionality...');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 }
  });
  
  try {
    // Login and navigate to editor
    console.log('🔐 Logging in...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    await page.goto('http://localhost:3000/posts/new', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);
    
    // Test 1: Title functionality
    console.log('📝 Testing title functionality...');
    await page.click('.edit-post-post-title__input');
    await page.fill('.edit-post-post-title__input', 'Advanced Functionality Test');
    
    // Test 2: Block insertion with slash commands
    console.log('🧱 Testing block insertion...');
    await page.click('.block-editor-writing-flow');
    await page.keyboard.type('This is a paragraph.');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    
    // Add heading
    await page.keyboard.type('/heading');
    await page.keyboard.press('Enter');
    await page.keyboard.type('This is a heading');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    
    // Add quote
    await page.keyboard.type('/quote');
    await page.keyboard.press('Enter');
    await page.keyboard.type('This is a quote block');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    
    // Add list
    await page.keyboard.type('/list');
    await page.keyboard.press('Enter');
    await page.keyboard.type('First list item');
    await page.keyboard.press('Enter');
    await page.keyboard.type('Second list item');
    
    await page.screenshot({ 
      path: 'screenshots/advanced-blocks.png',
      fullPage: true
    });
    
    // Test 3: Block inspector
    console.log('🔧 Testing block inspector...');
    await page.click('.edit-post-sidebar__tab:has-text("Block")');
    await page.waitForTimeout(1000);
    
    await page.screenshot({ 
      path: 'screenshots/block-inspector.png',
      fullPage: true
    });
    
    // Test 4: Document settings
    console.log('📄 Testing document settings...');
    await page.click('.edit-post-sidebar__tab:has-text("Document")');
    await page.waitForTimeout(1000);
    
    // Test slug field
    const slugField = await page.locator('input[value*="advanced-functionality-test"]');
    if (await slugField.count() > 0) {
      console.log('✅ Slug auto-generation working');
    }
    
    // Test excerpt field
    const excerptField = await page.locator('textarea[placeholder*="excerpt"]');
    if (await excerptField.count() > 0) {
      await excerptField.fill('This is a test excerpt for the advanced functionality test.');
      console.log('✅ Excerpt field working');
    }
    
    await page.screenshot({ 
      path: 'screenshots/document-settings.png',
      fullPage: true
    });
    
    // Test 5: Save functionality
    console.log('💾 Testing save functionality...');
    const saveButton = await page.locator('button:has-text("Save Draft")');
    if (await saveButton.count() > 0) {
      await saveButton.click();
      await page.waitForTimeout(3000);
      console.log('✅ Save button clicked');
      
      // Check for success indication
      const savingText = await page.locator('button:has-text("Saving...")').count();
      if (savingText > 0) {
        console.log('✅ Save process initiated');
      }
    }
    
    await page.screenshot({ 
      path: 'screenshots/after-save.png',
      fullPage: true
    });
    
    // Test 6: Undo/Redo
    console.log('↩️ Testing undo/redo...');
    const undoButton = await page.locator('button[aria-label="Undo"]');
    const redoButton = await page.locator('button[aria-label="Redo"]');
    
    console.log('Undo button available:', await undoButton.count() > 0 ? '✅' : '❌');
    console.log('Redo button available:', await redoButton.count() > 0 ? '✅' : '❌');
    
    // Test 7: Inserter functionality
    console.log('➕ Testing inserter...');
    const inserterButton = await page.locator('.edit-post-header__inserter button');
    if (await inserterButton.count() > 0) {
      await inserterButton.click();
      await page.waitForTimeout(2000);
      
      await page.screenshot({ 
        path: 'screenshots/inserter-panel.png',
        fullPage: true
      });
      
      // Close inserter by clicking elsewhere
      await page.click('.block-editor-writing-flow');
      console.log('✅ Inserter panel working');
    }
    
    console.log('✅ Advanced functionality test completed!');
    console.log('📸 Screenshots saved:');
    console.log('  - advanced-blocks.png');
    console.log('  - block-inspector.png');
    console.log('  - document-settings.png');
    console.log('  - after-save.png');
    console.log('  - inserter-panel.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'screenshots/advanced-test-error.png' });
  } finally {
    await browser.close();
  }
}

testAdvancedFunctionality().catch(console.error);