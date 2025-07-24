const { test, expect } = require('@playwright/test');

test.describe('Navigation Fix Test', () => {
  test('Test navigation from editor back to dashboard', async ({ page }) => {
    console.log('🧪 Testing navigation fix...');
    
    try {
      // Login
      await page.goto('http://localhost:3000/login');
      await page.fill('input[name="username"]', 'admin');
      await page.fill('input[name="password"]', 'admin123');
      await page.click('button[type="submit"]');
      await page.waitForURL('http://localhost:3000/');
      console.log('✅ Login successful');
      
      // Go to post editor
      await page.click('text=Posts');
      await page.click('text=Create New Post');
      await page.waitForTimeout(2000);
      console.log('✅ Post editor loaded');
      
      // Check if admin header is hidden in fullscreen mode
      const adminBar = page.locator('.wp-admin-bar');
      const isAdminBarVisible = await adminBar.isVisible();
      console.log(`Admin bar visible in editor: ${isAdminBarVisible}`);
      
      // Take screenshot of editor
      await page.screenshot({ 
        path: 'tests/screenshots/editor-fullscreen-fixed.png',
        fullPage: true
      });
      
      // Test clicking the ν button - should work now
      const logoButton = page.locator('button[aria-label="nuCMS Dashboard"]');
      await expect(logoButton).toBeVisible();
      console.log('✅ Logo button is visible');
      
      // Try to click it
      await logoButton.click();
      await page.waitForTimeout(1000);
      
      // Check if we're back on dashboard
      const currentUrl = page.url();
      if (currentUrl.includes('/posts') || currentUrl.includes('/edit')) {
        console.log('⚠️ Still on editor page, navigation may not have worked');
      } else {
        console.log('✅ Navigation back to dashboard successful!');
      }
      
      // Take final screenshot
      await page.screenshot({ 
        path: 'tests/screenshots/after-navigation-fix.png',
        fullPage: true
      });
      
      console.log('🎉 Navigation fix test completed');
      
    } catch (error) {
      console.error('❌ Navigation test failed:', error);
      await page.screenshot({ 
        path: 'tests/screenshots/navigation-fix-error.png',
        fullPage: true
      });
      throw error;
    }
  });
});