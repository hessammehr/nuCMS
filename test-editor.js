#!/usr/bin/env node
/**
 * Quick editor testing script
 * Usage: node test-editor.js
 */

const { chromium } = require('playwright');

async function testEditor() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 200
  });
  
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  const page = await context.newPage();

  try {
    console.log('🔍 Opening nuCMS editor...');
    await page.goto('http://localhost:3000');
    
    // Login
    console.log('🔐 Logging in...');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForSelector('.main-content', { timeout: 10000 });
    
    // Navigate to new post
    console.log('📝 Creating new post...');
    await page.click('a[href="/posts"]');
    await page.waitForURL('**/posts');
    await page.click('text=New Post');
    await page.waitForURL('**/posts/new');
    
    // Wait for editor to load
    await page.waitForSelector('.gutenberg-fullscreen-editor', { timeout: 10000 });
    
    console.log('✅ Editor loaded successfully!');
    console.log('🎯 You can now interact with the editor manually.');
    console.log('   - Try clicking the title area');
    console.log('   - Try adding content blocks');
    console.log('   - Try the block inserter and settings');
    console.log('');
    console.log('Press Ctrl+C to close browser when done...');
    
    // Keep browser open for manual testing
    await new Promise(() => {}); // Keep running forever
    
  } catch (error) {
    console.error('❌ Error:', error);
    await page.screenshot({ path: 'screenshots/test-error.png' });
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  testEditor().catch(console.error);
}

module.exports = { testEditor };