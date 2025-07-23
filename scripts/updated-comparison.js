const { chromium } = require('playwright');

async function compareWithGutenberg() {
  console.log('🚀 Comparing nuCMS editor with Gutenberg benchmark...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  try {
    // First, get nuCMS editor
    console.log('📝 Loading nuCMS editor...');
    const nucmsPage = await context.newPage();
    await nucmsPage.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    await nucmsPage.fill('input[type="text"]', 'admin');
    await nucmsPage.fill('input[type="password"]', 'admin123');
    await nucmsPage.click('button[type="submit"]');
    await nucmsPage.waitForTimeout(3000);
    
    await nucmsPage.goto('http://localhost:3000/posts/new', { waitUntil: 'networkidle' });
    await nucmsPage.waitForTimeout(5000);
    
    // Check for correct selectors
    const titleField = await nucmsPage.locator('.edit-post-post-title__input').count() > 0;
    const editorArea = await nucmsPage.locator('.block-editor-writing-flow').count() > 0;
    const toolbar = await nucmsPage.locator('.edit-post-header__toolbar').count() > 0;
    const sidebar = await nucmsPage.locator('.edit-post-sidebar').count() > 0;
    const inserter = await nucmsPage.locator('.edit-post-header__inserter').count() > 0;
    
    console.log('📊 nuCMS Editor elements:');
    console.log('  Title field (.edit-post-post-title__input):', titleField ? '✅' : '❌');
    console.log('  Editor area (.block-editor-writing-flow):', editorArea ? '✅' : '❌');
    console.log('  Toolbar (.edit-post-header__toolbar):', toolbar ? '✅' : '❌');
    console.log('  Sidebar (.edit-post-sidebar):', sidebar ? '✅' : '❌');
    console.log('  Block inserter (.edit-post-header__inserter):', inserter ? '✅' : '❌');
    
    // Test functionality
    if (titleField) {
      await nucmsPage.click('.edit-post-post-title__input');
      await nucmsPage.fill('.edit-post-post-title__input', 'Comparison Test Post');
    }
    
    if (editorArea) {
      await nucmsPage.click('.block-editor-writing-flow');
      await nucmsPage.keyboard.type('This is test content for comparison with Gutenberg.');
      await nucmsPage.keyboard.press('Enter');
      await nucmsPage.keyboard.press('Enter');
      
      // Try adding a heading
      await nucmsPage.keyboard.type('/heading');
      await nucmsPage.keyboard.press('Enter');
      await nucmsPage.keyboard.type('This is a test heading');
    }
    
    await nucmsPage.screenshot({ 
      path: 'screenshots/nucms-comparison.png',
      fullPage: true
    });
    
    // Now get Gutenberg benchmark
    console.log('📖 Loading Gutenberg benchmark...');
    const gutenbergPage = await context.newPage();
    
    try {
      await gutenbergPage.goto('https://wordpress.org/gutenberg/', { waitUntil: 'networkidle', timeout: 15000 });
      await gutenbergPage.waitForTimeout(5000);
      
      // Try to find the editor area
      const gutenbergEditor = await gutenbergPage.locator('.block-editor-writing-flow').count() > 0;
      const gutenbergTitle = await gutenbergPage.locator('[placeholder*="title"], [aria-label*="title"], .edit-post-post-title').count() > 0;
      
      console.log('📊 Gutenberg benchmark elements:');
      console.log('  Editor area:', gutenbergEditor ? '✅' : '❌');
      console.log('  Title area:', gutenbergTitle ? '✅' : '❌');
      
      await gutenbergPage.screenshot({ 
        path: 'screenshots/gutenberg-comparison.png',
        fullPage: true
      });
      
    } catch (error) {
      console.warn('⚠️ Could not load Gutenberg benchmark (possibly network issue):', error.message);
      console.log('📸 Using cached Gutenberg screenshot if available');
    }
    
    console.log('✅ Comparison completed!');
    console.log('📸 Screenshots saved:');
    console.log('  - nucms-comparison.png');
    console.log('  - gutenberg-comparison.png (if loaded)');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await nucmsPage?.screenshot({ path: 'screenshots/comparison-error.png' });
  } finally {
    await browser.close();
  }
}

compareWithGutenberg().catch(console.error);