const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function comprehensiveEditorTest() {
  console.log('🚀 Starting comprehensive editor test...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000,
    devtools: true
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  // Create two pages - one for Gutenberg benchmark, one for nuCMS
  const gutenbergPage = await context.newPage();
  const nucmsPage = await context.newPage();
  
  try {
    // First, go to Gutenberg benchmark
    console.log('📖 Loading Gutenberg benchmark...');
    await gutenbergPage.goto('https://wordpress.org/gutenberg/');
    await gutenbergPage.waitForLoadState('networkidle');
    
    // Wait for editor to be ready
    await gutenbergPage.waitForSelector('.block-editor-writing-flow', { timeout: 10000 });
    
    // Take screenshot of Gutenberg
    await gutenbergPage.screenshot({ 
      path: 'screenshots/gutenberg-benchmark-current.png',
      fullPage: true
    });
    
    console.log('🏠 Loading nuCMS editor...');
    // Go to nuCMS and login
    await nucmsPage.goto('http://localhost:3000/login');
    await nucmsPage.waitForLoadState('networkidle');
    
    // Login
    await nucmsPage.fill('input[type="text"]', 'admin');
    await nucmsPage.fill('input[type="password"]', 'admin123');
    await nucmsPage.click('button[type="submit"]');
    await nucmsPage.waitForNavigation();
    
    // Navigate to new post
    await nucmsPage.goto('http://localhost:3000/posts/new');
    await nucmsPage.waitForLoadState('networkidle');
    
    // Wait for editor to be ready
    await nucmsPage.waitForSelector('.block-editor-writing-flow', { timeout: 10000 });
    
    // Take screenshot of nuCMS initial state
    await nucmsPage.screenshot({ 
      path: 'screenshots/nucms-editor-current.png',
      fullPage: true
    });
    
    console.log('🔍 Testing basic editor functionality...');
    
    // Test 1: Add title
    const titleSelector = '.wp-block-post-title';
    await nucmsPage.click(titleSelector);
    await nucmsPage.fill(titleSelector, 'Test Editor Functionality');
    
    // Test 2: Add content blocks
    await nucmsPage.click('.block-editor-writing-flow');
    await nucmsPage.keyboard.type('This is a test paragraph to verify editor functionality.');
    await nucmsPage.keyboard.press('Enter');
    await nucmsPage.keyboard.press('Enter');
    
    // Test 3: Add a heading block
    await nucmsPage.keyboard.type('/heading');
    await nucmsPage.keyboard.press('Enter');
    await nucmsPage.keyboard.type('This is a heading');
    
    // Test 4: Try to add an image block
    await nucmsPage.keyboard.press('Enter');
    await nucmsPage.keyboard.press('Enter');
    await nucmsPage.keyboard.type('/image');
    await nucmsPage.keyboard.press('Enter');
    
    // Take screenshot after adding content
    await nucmsPage.screenshot({ 
      path: 'screenshots/nucms-with-content-current.png',
      fullPage: true
    });
    
    console.log('🔧 Testing editor controls...');
    
    // Test 5: Document settings panel
    const settingsButton = nucmsPage.locator('.edit-post-header-toolbar button[aria-label*="Settings"]').first();
    if (await settingsButton.isVisible()) {
      await settingsButton.click();
      await nucmsPage.waitForTimeout(1000);
    }
    
    // Take screenshot with settings panel
    await nucmsPage.screenshot({ 
      path: 'screenshots/nucms-with-settings-current.png',
      fullPage: true
    });
    
    console.log('💾 Testing save functionality...');
    
    // Test 6: Save the post
    const saveButton = nucmsPage.locator('button:has-text("Save"), button:has-text("Publish")').first();
    if (await saveButton.isVisible()) {
      await saveButton.click();
      await nucmsPage.waitForTimeout(2000);
    }
    
    // Final screenshot
    await nucmsPage.screenshot({ 
      path: 'screenshots/nucms-final-state-current.png',
      fullPage: true
    });
    
    console.log('✅ Comprehensive test completed!');
    console.log('📸 Screenshots saved:');
    console.log('  - gutenberg-benchmark-current.png');
    console.log('  - nucms-editor-current.png');
    console.log('  - nucms-with-content-current.png');
    console.log('  - nucms-with-settings-current.png');
    console.log('  - nucms-final-state-current.png');
    
    // Keep browsers open for manual inspection
    console.log('🔍 Browsers will stay open for manual inspection...');
    console.log('Press Ctrl+C to close browsers and exit.');
    
    // Wait for manual termination
    await new Promise(() => {});
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await nucmsPage.screenshot({ 
      path: 'screenshots/error-state.png',
      fullPage: true
    });
  } finally {
    // Note: we don't close the browser automatically to allow manual inspection
  }
}

comprehensiveEditorTest().catch(console.error);