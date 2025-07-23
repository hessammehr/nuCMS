const { chromium } = require('playwright');

async function testLogoNavigation() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🧪 Testing logo and navigation functionality...');

    // Login to nuCMS
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:3000/');

    // Go to create new post
    await page.goto('http://localhost:3000/posts/new');
    await page.waitForLoadState('networkidle');

    console.log('🔍 Testing logo appearance and functionality...');

    // Check if the logo is visible and has the nu character
    const logo = page.locator('.edit-post-header__logo');
    await logo.waitFor();

    const logoText = await logo.textContent();
    console.log(`📊 Logo text: "${logoText}"`);

    const logoLabel = await logo.getAttribute('aria-label') || await logo.getAttribute('title') || 'No label';
    console.log(`🏷️ Logo label: "${logoLabel}"`);

    // Test clicking logo with no content (should navigate directly)
    console.log('🖱️ Testing logo click with no content...');
    await logo.click();
    
    // Wait for navigation or dialog
    await page.waitForTimeout(1000);
    
    const currentUrl = page.url();
    console.log(`📍 URL after logo click with no content: ${currentUrl}`);

    if (currentUrl.includes('/posts') && !currentUrl.includes('/new')) {
      console.log('✅ Successfully navigated back to posts list');
    } else {
      console.log('⚠️ Did not navigate as expected');
    }

    // Go back to editor and add content
    console.log('📝 Testing with unsaved changes...');
    await page.goto('http://localhost:3000/posts/new');
    await page.waitForLoadState('networkidle');

    // Add some content
    await page.fill('.edit-post-post-title__input', 'Test Post with Content');
    await page.click('.block-editor-writing-flow');
    await page.keyboard.type('This is some test content that should trigger unsaved changes warning.');

    // Wait for changes to be detected
    await page.waitForTimeout(500);

    console.log('🖱️ Testing logo click with unsaved changes...');
    
    // Set up dialog handler
    let dialogMessage = '';
    page.on('dialog', async dialog => {
      dialogMessage = dialog.message();
      console.log(`🔔 Dialog appeared: "${dialogMessage}"`);
      await dialog.dismiss(); // Cancel the navigation
    });

    // Click logo - should show confirmation dialog
    await logo.click();
    await page.waitForTimeout(1000);

    if (dialogMessage) {
      console.log('✅ Unsaved changes dialog appeared correctly');
      console.log(`📝 Dialog message: "${dialogMessage}"`);
    } else {
      console.log('⚠️ No unsaved changes dialog appeared');
    }

    // Test accepting the dialog
    console.log('🖱️ Testing accepting the unsaved changes dialog...');
    page.removeAllListeners('dialog');
    page.on('dialog', async dialog => {
      console.log(`🔔 Dialog: "${dialog.message()}"`);
      await dialog.accept(); // Accept and navigate away
    });

    await logo.click();
    await page.waitForTimeout(2000);

    const finalUrl = page.url();
    console.log(`📍 Final URL after accepting dialog: ${finalUrl}`);

    if (finalUrl.includes('/posts') && !finalUrl.includes('/new')) {
      console.log('✅ Successfully navigated after accepting dialog');
    } else {
      console.log('⚠️ Did not navigate after accepting dialog');
    }

    // Take final screenshot
    await page.screenshot({ path: 'logo-navigation-test.png' });

    console.log('✅ Logo navigation test completed');

  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'logo-navigation-error.png' });
  } finally {
    await browser.close();
  }
}

testLogoNavigation();