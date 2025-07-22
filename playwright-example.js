const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 }); // Slow down for better visibility
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:3000');
    
    // Take a screenshot of login page
    await page.screenshot({ path: 'login-page.png', fullPage: true });
    console.log('Login page screenshot saved as login-page.png');
    
    // Check if we're on the login page
    const hasLoginForm = await page.locator('input[type="password"]').isVisible().catch(() => false);
    
    if (hasLoginForm) {
      console.log('Found login form, attempting to login...');
      
      // Fill in login credentials
      await page.fill('input[name="username"], input[type="text"]', 'admin');
      await page.fill('input[type="password"]', 'admin123');
      
      // Click login button
      await page.click('button[type="submit"], button:has-text("Login")');
      
      // Wait for navigation after login
      await page.waitForTimeout(2000);
      
      // Take screenshot after login
      await page.screenshot({ path: 'after-login.png', fullPage: true });
      console.log('After login screenshot saved as after-login.png');
      
      // Check what page we're on now
      const currentUrl = page.url();
      const title = await page.title();
      const bodyText = await page.locator('body').textContent();
      
      console.log('Current URL:', currentUrl);
      console.log('Page title:', title);
      console.log('Page content preview:', bodyText?.slice(0, 500) + '...');
      
      // Check for common elements after login
      const hasNavigation = await page.locator('nav').isVisible().catch(() => false);
      const hasDashboard = await page.locator('text=Dashboard').isVisible().catch(() => false);
      const hasLogout = await page.locator('button:has-text("Logout"), a:has-text("Logout")').isVisible().catch(() => false);
      
      console.log('Has navigation:', hasNavigation);
      console.log('Has dashboard text:', hasDashboard);
      console.log('Has logout option:', hasLogout);
    } else {
      console.log('No login form found - might already be logged in or different page');
      const title = await page.title();
      const bodyText = await page.locator('body').textContent();
      console.log('Page title:', title);
      console.log('Page content preview:', bodyText?.slice(0, 500) + '...');
    }
    
    // If we successfully logged in, test complex interactions
    if (hasNavigation || hasDashboard) {
      console.log('\n=== Testing Complex Interactions ===');
      
      // Test 1: Navigation hover effects
      const navItems = await page.locator('nav a, nav button').all();
      if (navItems.length > 0) {
        console.log(`Found ${navItems.length} navigation items, testing hover effects...`);
        
        for (let i = 0; i < Math.min(navItems.length, 3); i++) {
          const navItem = navItems[i];
          const text = await navItem.textContent();
          console.log(`Hovering over: "${text}"`);
          
          // Get style before hover
          const beforeHover = await navItem.evaluate(el => getComputedStyle(el).backgroundColor);
          
          // Hover and check for style changes
          await navItem.hover();
          await page.waitForTimeout(500);
          
          const afterHover = await navItem.evaluate(el => getComputedStyle(el).backgroundColor);
          console.log(`  Hover effect: ${beforeHover !== afterHover ? 'YES' : 'NO'} (${beforeHover} → ${afterHover})`);
        }
      }
      
      // Test 2: Navigate to different sections and test interactions
      const testSections = ['Posts', 'Pages', 'Media'];
      
      for (const section of testSections) {
        const sectionLink = page.locator(`a:has-text("${section}"), button:has-text("${section}")`);
        
        if (await sectionLink.isVisible()) {
          console.log(`\n--- Testing ${section} section ---`);
          await sectionLink.click();
          await page.waitForTimeout(2000);
          
          // Take screenshot of this section
          await page.screenshot({ path: `${section.toLowerCase()}-page.png`, fullPage: true });
          console.log(`Screenshot saved: ${section.toLowerCase()}-page.png`);
          
          // Test buttons and their states
          const buttons = await page.locator('button').all();
          console.log(`Found ${buttons.length} buttons in ${section}`);
          
          for (let i = 0; i < Math.min(buttons.length, 3); i++) {
            const button = buttons[i];
            if (await button.isVisible()) {
              const text = await button.textContent();
              const isEnabled = await button.isEnabled();
              console.log(`  Button: "${text?.trim()}" - Enabled: ${isEnabled}`);
              
              // Test hover on buttons
              if (isEnabled && text?.trim() !== 'Logout') {
                await button.hover();
                const hoverColor = await button.evaluate(el => getComputedStyle(el).backgroundColor);
                console.log(`    Hover color: ${hoverColor}`);
              }
            }
          }
          
          // Test form interactions if this is a "New" page
          if (page.url().includes('/new')) {
            console.log(`  Testing form interactions on new ${section} page...`);
            
            // Look for title input
            const titleInput = page.locator('input[placeholder*="title"], input[name*="title"]');
            if (await titleInput.isVisible()) {
              await titleInput.fill(`Test ${section} Title - ${Date.now()}`);
              console.log(`  Filled title input`);
              
              // Test focus/blur effects
              await titleInput.focus();
              const focusColor = await titleInput.evaluate(el => getComputedStyle(el).borderColor);
              await titleInput.blur();
              const blurColor = await titleInput.evaluate(el => getComputedStyle(el).borderColor);
              console.log(`  Focus effect: ${focusColor !== blurColor ? 'YES' : 'NO'}`);
            }
            
            // Look for Gutenberg editor
            const editor = page.locator('.block-editor-writing-flow, .wp-block-post-content');
            if (await editor.isVisible()) {
              console.log(`  Found Gutenberg editor, testing...`);
              await editor.click();
              await page.keyboard.type('This is test content added by Playwright automation!');
              console.log(`  Added content to editor`);
              
              // Test block selection
              await page.keyboard.press('Escape');
              const blocks = await page.locator('.wp-block').all();
              if (blocks.length > 0) {
                console.log(`  Found ${blocks.length} blocks, testing selection...`);
                await blocks[0].click();
                const isSelected = await blocks[0].evaluate(el => el.classList.contains('is-selected'));
                console.log(`  Block selection: ${isSelected ? 'YES' : 'NO'}`);
              }
            }
            
            // Go back to avoid saving
            await page.goBack();
            await page.waitForTimeout(1000);
          }
        }
      }
      
      // Test 3: Test responsive behavior
      console.log('\n--- Testing Responsive Behavior ---');
      const viewports = [
        { name: 'Desktop', width: 1280, height: 720 },
        { name: 'Tablet', width: 768, height: 1024 },
        { name: 'Mobile', width: 375, height: 667 }
      ];
      
      for (const viewport of viewports) {
        console.log(`Testing ${viewport.name} viewport (${viewport.width}x${viewport.height})`);
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.waitForTimeout(1000);
        
        // Check if navigation changes (mobile menu, etc.)
        const navVisible = await page.locator('nav').isVisible();
        const mobileMenu = await page.locator('.mobile-menu, .hamburger, [aria-label*="menu"]').isVisible();
        console.log(`  Navigation visible: ${navVisible}, Mobile menu: ${mobileMenu}`);
        
        await page.screenshot({ path: `responsive-${viewport.name.toLowerCase()}.png` });
        console.log(`  Screenshot saved: responsive-${viewport.name.toLowerCase()}.png`);
      }
      
      // Reset to desktop
      await page.setViewportSize({ width: 1280, height: 720 });
    }
    
    // Wait a moment so you can see the final state
    console.log('\n=== Test Complete ===');
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.log('Error accessing page:', error.message);
    await page.screenshot({ path: 'error-screenshot.png' });
  }
  
  await browser.close();
})();