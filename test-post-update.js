const { chromium } = require('playwright');

async function testPostUpdate() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🧪 Testing post update functionality...');

    // Login first
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:3000/');

    // Go to posts list
    await page.goto('http://localhost:3000/posts');
    await page.waitForLoadState('networkidle');

    // Check if there are any existing posts
    const existingPosts = await page.locator('.post-item').count();
    console.log(`📋 Found ${existingPosts} existing posts`);

    let postId;
    if (existingPosts > 0) {
      // Edit the first existing post
      await page.click('.post-item:first-child .edit-button');
      const url = page.url();
      postId = url.match(/\/posts\/(\d+)\/edit/)?.[1];
      console.log(`✏️ Editing existing post with ID: ${postId}`);
    } else {
      // Create a new post first
      await page.click('button:has-text("New Post")');
      await page.waitForURL('http://localhost:3000/posts/new');
      
      // Add title and content
      await page.fill('[data-testid="title-input"]', 'Test Post for Update');
      await page.click('.block-editor-writing-flow');
      await page.keyboard.type('Initial content for testing updates.');
      
      // Save the post
      await page.click('button:has-text("Save")');
      await page.waitForTimeout(2000);
      
      // Extract post ID from URL after creation
      const url = page.url();
      postId = url.match(/\/posts\/(\d+)\/edit/)?.[1];
      console.log(`📝 Created new post with ID: ${postId}`);
    }

    if (!postId) {
      throw new Error('Could not determine post ID');
    }

    // Now test updating the post
    console.log('🔄 Testing post update...');
    
    // Update the title
    await page.fill('[data-testid="title-input"]', 'Updated Test Post Title');
    
    // Update content - click in editor and add text
    await page.click('.block-editor-writing-flow');
    await page.keyboard.press('End');
    await page.keyboard.type(' Updated content!');
    
    // Save the changes
    console.log('💾 Attempting to save updated post...');
    await page.click('button:has-text("Save")');
    
    // Wait for save response
    await page.waitForTimeout(3000);
    
    // Check for success/error messages
    const successMessage = await page.locator('.success-message').textContent().catch(() => null);
    const errorMessage = await page.locator('.error-message').textContent().catch(() => null);
    
    if (successMessage) {
      console.log('✅ Success message:', successMessage);
    }
    if (errorMessage) {
      console.log('❌ Error message:', errorMessage);
    }
    
    // Check network tab for API requests
    const responses = [];
    page.on('response', response => {
      if (response.url().includes('/api/posts/')) {
        responses.push({
          url: response.url(),
          status: response.status(),
          method: response.request().method()
        });
      }
    });
    
    // Try saving again to capture network traffic
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(2000);
    
    console.log('🌐 API requests made:', responses);
    
    // Check console for errors
    const logs = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        logs.push(msg.text());
      }
    });
    
    if (logs.length > 0) {
      console.log('🚨 Console errors:', logs);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'post-update-error.png' });
  } finally {
    await browser.close();
  }
}

testPostUpdate();