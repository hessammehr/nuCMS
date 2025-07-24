const { test, expect } = require('@playwright/test');

test.describe('Comprehensive Admin Interface Testing', () => {
  test('Test all admin interface functionality', async ({ page }) => {
    console.log('🧪 Starting comprehensive admin interface test...');
    
    try {
      // 1. Test Login
      await page.goto('http://localhost:3000/login');
      await page.fill('input[name="username"]', 'admin');
      await page.fill('input[name="password"]', 'admin123');
      await page.click('button[type="submit"]');
      await page.waitForURL('http://localhost:3000/');
      console.log('✅ Login successful');
      
      // Take screenshot of dashboard
      await page.screenshot({ 
        path: 'tests/screenshots/admin-dashboard-full.png',
        fullPage: true
      });
      
      // 2. Test Dashboard Navigation
      const dashboardTitle = page.locator('h1:has-text("Dashboard")');
      await expect(dashboardTitle).toBeVisible();
      console.log('✅ Dashboard loads correctly');
      
      // Check dashboard stats cards
      const statsCards = page.locator('.wp-stat-card');
      const cardCount = await statsCards.count();
      console.log(`✅ Found ${cardCount} stat cards on dashboard`);
      
      // 3. Test Posts Section
      console.log('🔍 Testing Posts section...');
      await page.click('text=Posts');
      await page.waitForTimeout(1000);
      
      await page.screenshot({ 
        path: 'tests/screenshots/admin-posts-list.png',
        fullPage: true
      });
      
      // Test creating a new post
      await page.click('text=Create New Post');
      await page.waitForTimeout(2000);
      
      // Test post editor functionality
      const titleInput = page.locator('.edit-post-post-title__input');
      await expect(titleInput).toBeVisible();
      await titleInput.fill('Comprehensive Test Post');
      
      // Test adding content
      const paragraphBlock = page.locator('[data-type="core/paragraph"]').first();
      if (await paragraphBlock.isVisible()) {
        await paragraphBlock.click();
        await paragraphBlock.fill('This is content for testing the comprehensive admin interface.');
      }
      
      await page.screenshot({ 
        path: 'tests/screenshots/admin-post-editor-test.png',
        fullPage: true
      });
      
      console.log('✅ Post editor works correctly');
      
      // Navigate back to dashboard
      await page.click('button:has-text("ν")');
      await page.waitForTimeout(1000);
      
      // 4. Test Pages Section
      console.log('🔍 Testing Pages section...');
      await page.click('text=Pages');
      await page.waitForTimeout(1000);
      
      await page.screenshot({ 
        path: 'tests/screenshots/admin-pages-list.png',
        fullPage: true
      });
      
      // 5. Test Media Section
      console.log('🔍 Testing Media section...');
      await page.click('text=Media');
      await page.waitForTimeout(1000);
      
      await page.screenshot({ 
        path: 'tests/screenshots/admin-media-list.png',
        fullPage: true
      });
      
      // 6. Test Users Section
      console.log('🔍 Testing Users section...');
      await page.click('text=Users');
      await page.waitForTimeout(1000);
      
      await page.screenshot({ 
        path: 'tests/screenshots/admin-users-list.png',
        fullPage: true
      });
      
      // Test if users table is visible
      const usersTable = page.locator('.wp-list-table');
      if (await usersTable.isVisible()) {
        console.log('✅ Users table is visible');
        
        // Check for admin user
        const adminUser = page.locator('text=admin');
        if (await adminUser.isVisible()) {
          console.log('✅ Admin user is listed');
        }
      }
      
      // 7. Test User Menu
      console.log('🔍 Testing user menu...');
      const userButton = page.locator('.wp-admin-bar__user-button');
      if (await userButton.isVisible()) {
        await userButton.click();
        await page.waitForTimeout(500);
        
        await page.screenshot({ 
          path: 'tests/screenshots/admin-user-menu.png',
          fullPage: true
        });
        
        console.log('✅ User menu opens correctly');
        
        // Close menu by clicking elsewhere
        await page.click('body');
      }
      
      // 8. Test Header Navigation
      console.log('🔍 Testing header navigation...');
      const headerNav = page.locator('.wp-admin-bar__nav');
      await expect(headerNav).toBeVisible();
      console.log('✅ Header navigation is visible');
      
      // 9. Final screenshot of dashboard
      await page.click('text=Dashboard');
      await page.waitForTimeout(1000);
      
      await page.screenshot({ 
        path: 'tests/screenshots/admin-dashboard-final.png',
        fullPage: true
      });
      
      console.log('✅ All admin interface tests completed successfully!');
      console.log('📁 Screenshots saved to tests/screenshots/');
      
    } catch (error) {
      console.error('❌ Admin interface test failed:', error);
      await page.screenshot({ 
        path: 'tests/screenshots/admin-test-error.png',
        fullPage: true
      });
      throw error;
    }
  });
  
  test('Test responsive behavior', async ({ browser }) => {
    console.log('📱 Testing responsive design...');
    
    // Test on mobile viewport
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 }
    });
    const page = await context.newPage();
    
    try {
      await page.goto('http://localhost:3000/login');
      await page.fill('input[name="username"]', 'admin');
      await page.fill('input[name="password"]', 'admin123');
      await page.click('button[type="submit"]');
      await page.waitForURL('http://localhost:3000/');
      
      await page.screenshot({ 
        path: 'tests/screenshots/admin-mobile-dashboard.png',
        fullPage: true
      });
      
      // Test navigation on mobile
      await page.click('text=Posts');
      await page.waitForTimeout(1000);
      
      await page.screenshot({ 
        path: 'tests/screenshots/admin-mobile-posts.png',
        fullPage: true
      });
      
      console.log('✅ Mobile responsive test completed');
      
    } catch (error) {
      console.error('❌ Mobile test failed:', error);
      throw error;
    } finally {
      await context.close();
    }
  });
});