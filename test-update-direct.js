const { chromium } = require('playwright');

async function testPostUpdateDirect() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Capture API calls
  const apiCalls = [];
  page.on('response', async (response) => {
    if (response.url().includes('/api/posts/')) {
      const method = response.request().method();
      const url = response.url();
      const status = response.status();
      let body = null;
      
      try {
        if (method === 'PUT' || method === 'POST') {
          body = await response.text();
        }
      } catch (e) {
        // Ignore if body can't be read
      }
      
      apiCalls.push({ method, url, status, body });
    }
  });

  // Capture console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    console.log('🧪 Testing post update functionality directly...');

    // Login first
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:3000/');

    console.log('✅ Login successful');

    // Create a new post first
    console.log('📝 Creating a new post...');
    await page.goto('http://localhost:3000/posts/new');
    await page.waitForLoadState('networkidle');

    // Fill in title with timestamp to avoid slug conflicts
    const timestamp = Date.now();
    await page.fill('.edit-post-post-title__input', `Test Post for Update ${timestamp}`);
    
    // Click in the editor area and add content
    await page.click('.block-editor-writing-flow');
    await page.keyboard.type('This is initial content for the post.');
    
    console.log('💾 Saving new post...');
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(3000);

    // Get the current URL to extract post ID
    let currentUrl = page.url();
    const postId = currentUrl.match(/\/posts\/(\d+)\/edit/)?.[1];
    
    if (!postId) {
      throw new Error('Could not extract post ID from URL: ' + currentUrl);
    }
    
    console.log(`✅ Created post with ID: ${postId}`);

    // Clear previous API calls
    apiCalls.length = 0;

    // Now test updating the post
    console.log('🔄 Testing post update...');
    
    // Update title
    await page.fill('.edit-post-post-title__input', 'Updated Test Post Title');
    
    // Update content
    await page.click('.block-editor-writing-flow');
    await page.keyboard.press('End');
    await page.keyboard.type(' UPDATED CONTENT!');
    
    console.log('💾 Attempting to save updated post...');
    await page.click('button:has-text("Save")');
    
    // Wait for response
    await page.waitForTimeout(5000);
    
    // Check for messages
    const successMessage = await page.locator('.success-message').textContent().catch(() => null);
    const errorMessage = await page.locator('.error-message').textContent().catch(() => null);
    
    console.log('📊 Results:');
    if (successMessage) {
      console.log('✅ Success message:', successMessage);
    }
    if (errorMessage) {
      console.log('❌ Error message:', errorMessage);
    }
    
    console.log('🌐 API calls made during update:');
    apiCalls.forEach(call => {
      console.log(`  ${call.method} ${call.url} - Status: ${call.status}`);
      if (call.body && call.body.length < 500) {
        console.log(`    Body: ${call.body}`);
      }
    });
    
    if (consoleErrors.length > 0) {
      console.log('🚨 Console errors:');
      consoleErrors.forEach(error => console.log(`  ${error}`));
    }

    // Take a screenshot
    await page.screenshot({ path: 'post-update-test.png' });
    
    // Try to navigate back to posts list to see if the update persisted
    console.log('🔍 Checking if update persisted...');
    await page.goto('http://localhost:3000/posts');
    await page.waitForTimeout(2000);
    
    const postTitles = await page.locator('.post-card h3').allTextContents();
    console.log('📋 Post titles on posts page:', postTitles);
    
    if (postTitles.some(title => title.includes('Updated Test Post Title'))) {
      console.log('✅ Update persisted successfully!');
    } else {
      console.log('❌ Update did not persist!');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'post-update-error.png' });
  } finally {
    await browser.close();
  }
}

testPostUpdateDirect();