const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('User Interface Check', () => {
  test('should capture user management interface', async ({ page }) => {
    console.log('Starting user interface test...');
    
    try {
      // Navigate to the application
      console.log('Navigating to http://localhost:3000');
      await page.goto('http://localhost:3000', { timeout: 30000 });
      
      // Take screenshot of login page
      await page.screenshot({ 
        path: path.join(__dirname, 'screenshots', 'current-login.png'),
        fullPage: true 
      });
      console.log('Login page screenshot captured');
      
      // Login as admin using correct selectors
      console.log('Logging in as admin...');
      await page.fill('input[name="username"]', 'admin');
      await page.fill('input[name="password"]', 'admin123');
      await page.click('button[type="submit"]');
      
      // Wait for navigation to dashboard
      await page.waitForURL('http://localhost:3000/', { timeout: 10000 });
      
      // Take screenshot of dashboard
      await page.screenshot({ 
        path: path.join(__dirname, 'screenshots', 'current-dashboard.png'),
        fullPage: true 
      });
      console.log('Dashboard screenshot captured');
      
      // Navigate to Users page
      console.log('Navigating to Users page...');
      await page.click('a[href="/users"]');
      await page.waitForURL('http://localhost:3000/users', { timeout: 10000 });
      
      // Take screenshot of users page
      await page.screenshot({ 
        path: path.join(__dirname, 'screenshots', 'current-users.png'),
        fullPage: true 
      });
      console.log('Users page screenshot captured');
      
      // Navigate to Posts page
      console.log('Navigating to Posts page...');
      await page.click('a[href="/posts"]');
      await page.waitForURL('http://localhost:3000/posts', { timeout: 10000 });
      
      // Take screenshot of posts page
      await page.screenshot({ 
        path: path.join(__dirname, 'screenshots', 'current-posts.png'),
        fullPage: true 
      });
      console.log('Posts page screenshot captured');
      
      // Navigate to Media page
      console.log('Navigating to Media page...');
      await page.click('a[href="/media"]');
      await page.waitForURL('http://localhost:3000/media', { timeout: 10000 });
      
      // Take screenshot of media page
      await page.screenshot({ 
        path: path.join(__dirname, 'screenshots', 'current-media.png'),
        fullPage: true 
      });
      console.log('Media page screenshot captured');
      
      // Go back to Users and test the Add User modal
      await page.click('a[href="/users"]');
      await page.waitForURL('http://localhost:3000/users', { timeout: 10000 });
      
      // Click Add New User
      await page.click('button:has-text("Add New User")');
      await page.waitForSelector('.components-modal__frame', { timeout: 5000 });
      
      // Take screenshot of add user modal
      await page.screenshot({ 
        path: path.join(__dirname, 'screenshots', 'current-add-user-modal.png'),
        fullPage: true 
      });
      console.log('Add user modal screenshot captured');
      
      console.log('All screenshots captured successfully!');
      
    } catch (error) {
      console.error('Test failed with error:', error.message);
      
      // Take screenshot of current state for debugging
      await page.screenshot({ 
        path: path.join(__dirname, 'screenshots', 'error-state-debug.png'),
        fullPage: true 
      });
      console.log('Error state screenshot captured');
      
      throw error;
    }
  });
});