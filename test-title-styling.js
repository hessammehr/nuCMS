const { chromium } = require('playwright');

async function testTitleStyling() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🧪 Testing post title styling behavior...');

    // Login to nuCMS
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:3000/');

    // Go to create new post
    await page.goto('http://localhost:3000/posts/new');
    await page.waitForLoadState('networkidle');

    console.log('📝 Analyzing title field styling...');

    // Get initial styling of the title field (with placeholder)
    const titleInput = page.locator('.edit-post-post-title__input');
    await titleInput.waitFor();

    // Get computed styles before typing
    const initialStyles = await titleInput.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        fontFamily: computed.fontFamily,
        fontWeight: computed.fontWeight,
        fontSize: computed.fontSize,
        color: computed.color,
        opacity: computed.opacity,
        fontStyle: computed.fontStyle
      };
    });

    console.log('📊 Initial title field styles (with placeholder):');
    console.log(JSON.stringify(initialStyles, null, 2));

    // Take screenshot before typing
    await page.screenshot({ path: 'title-before-typing.png' });

    // Click in the title field and start typing
    await titleInput.click();
    await titleInput.type('Test Title for Style Analysis');

    // Get computed styles after typing
    const afterTypingStyles = await titleInput.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        fontFamily: computed.fontFamily,
        fontWeight: computed.fontWeight,
        fontSize: computed.fontSize,
        color: computed.color,
        opacity: computed.opacity,
        fontStyle: computed.fontStyle
      };
    });

    console.log('📊 Title field styles after typing:');
    console.log(JSON.stringify(afterTypingStyles, null, 2));

    // Take screenshot after typing
    await page.screenshot({ path: 'title-after-typing.png' });

    // Compare the styles
    console.log('🔍 Style comparison:');
    const keys = Object.keys(initialStyles);
    let hasChanges = false;

    keys.forEach(key => {
      if (initialStyles[key] !== afterTypingStyles[key]) {
        console.log(`  ${key}: "${initialStyles[key]}" → "${afterTypingStyles[key]}"`);
        hasChanges = true;
      }
    });

    if (!hasChanges) {
      console.log('  ✅ No style changes detected');
    } else {
      console.log('  ⚠️ Style changes detected!');
    }

    // Also check the actual text content and placeholder
    const hasPlaceholder = await titleInput.evaluate(el => el.placeholder);
    const textContent = await titleInput.inputValue();
    
    console.log('📝 Content analysis:');
    console.log(`  Placeholder: "${hasPlaceholder}"`);
    console.log(`  Text content: "${textContent}"`);

    // Test clearing the field to see if it reverts
    await titleInput.press('Control+a'); // Select all
    await titleInput.press('Delete');
    
    // Wait a moment and check styles again
    await page.waitForTimeout(300);
    
    const clearedStyles = await titleInput.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        fontFamily: computed.fontFamily,
        fontWeight: computed.fontWeight,
        fontSize: computed.fontSize,
        color: computed.color,
        opacity: computed.opacity,
        fontStyle: computed.fontStyle
      };
    });

    console.log('📊 Title field styles after clearing:');
    console.log(JSON.stringify(clearedStyles, null, 2));

    // Take screenshot after clearing
    await page.screenshot({ path: 'title-after-clearing.png' });

    console.log('✅ Title styling analysis completed');

  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'title-styling-error.png' });
  } finally {
    await browser.close();
  }
}

testTitleStyling();