const { chromium } = require('playwright');

async function checkPostsPage() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Go to login page
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    // Login
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // Go to posts page
    await page.goto('http://localhost:3000/posts');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot
    await page.screenshot({ path: 'posts-page.png', fullPage: true });
    console.log('Screenshot saved as posts-page.png');
    
    // Get page content
    const pageContent = await page.content();
    console.log('Page URL:', page.url());
    console.log('Page title:', await page.title());
    
    // Look for "New Post" buttons
    const newPostButtons = await page.locator('a:has-text("New Post"), button:has-text("New Post"), a[href*="/new"], button[href*="/new"]').all();
    console.log('New Post buttons found:', newPostButtons.length);
    
    // Look for any posts
    const postItems = await page.locator('.post-item, .post-row, [data-testid="post"]').all();
    console.log('Post items found:', postItems.length);
    
    // Get all links
    const allLinks = await page.locator('a').all();
    const linkTexts = [];
    for (const link of allLinks.slice(0, 10)) { // First 10 links
      const text = await link.textContent();
      const href = await link.getAttribute('href');
      linkTexts.push({ text: text?.trim(), href });
    }
    console.log('First 10 links:', linkTexts);
    
    await page.waitForTimeout(5000); // Keep browser open for 5 seconds
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

checkPostsPage();