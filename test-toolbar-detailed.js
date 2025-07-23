const { chromium } = require('playwright');

async function testToolbarDetailed() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🧪 Testing detailed block toolbar behavior...');

    // Login to nuCMS
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:3000/');

    // Go to create new post
    await page.goto('http://localhost:3000/posts/new');
    await page.waitForLoadState('networkidle');

    // Add a title
    await page.fill('.edit-post-post-title__input', 'Toolbar Behavior Test');
    
    // Click in the editor and add content
    await page.click('.block-editor-writing-flow');
    await page.keyboard.type('This paragraph will be used to test block toolbar behavior.');

    console.log('🔍 Testing block selection and toolbar interaction...');
    
    // Select the paragraph block by clicking on it
    await page.click('.wp-block-paragraph');
    await page.waitForTimeout(500);

    // Check toolbar visibility and position
    const toolbarVisible = await page.locator('.block-editor-block-toolbar').isVisible();
    console.log(`📊 Block toolbar visible: ${toolbarVisible}`);

    if (toolbarVisible) {
      const toolbarBox = await page.locator('.block-editor-block-toolbar').boundingBox();
      console.log(`📐 Toolbar position: x=${toolbarBox.x}, y=${toolbarBox.y}, width=${toolbarBox.width}, height=${toolbarBox.height}`);

      // Test toolbar buttons
      const buttons = await page.locator('.block-editor-block-toolbar button').all();
      console.log(`🔘 Toolbar button count: ${buttons.length}`);

      // Get the paragraph block position for comparison
      const paragraphBox = await page.locator('.wp-block-paragraph').boundingBox();
      console.log(`📝 Paragraph position: x=${paragraphBox.x}, y=${paragraphBox.y}, width=${paragraphBox.width}, height=${paragraphBox.height}`);

      // Check if toolbar is positioned above the block (as it should be)
      const isAboveBlock = toolbarBox.y < paragraphBox.y;
      console.log(`⬆️ Toolbar is above block: ${isAboveBlock}`);

      // Test clicking toolbar buttons
      console.log('🖱️ Testing toolbar button interactions...');
      
      try {
        // Try to click the first button (usually bold/text formatting)
        const firstButton = page.locator('.block-editor-block-toolbar button').first();
        if (await firstButton.isVisible()) {
          const buttonTitle = await firstButton.getAttribute('aria-label') || await firstButton.getAttribute('title') || 'No label';
          console.log(`🔘 First button label: "${buttonTitle}"`);
          
          // Click the button
          await firstButton.click();
          await page.waitForTimeout(300);
          console.log('✅ Successfully clicked first toolbar button');
        }
      } catch (buttonError) {
        console.log('⚠️ Could not interact with toolbar buttons:', buttonError.message);
      }
    }

    // Test toolbar behavior when selecting different blocks
    console.log('📝 Testing toolbar with different block types...');
    
    // Add a new paragraph block
    await page.keyboard.press('Enter');
    await page.keyboard.type('Second paragraph for testing toolbar position changes.');
    
    // Select the new paragraph
    await page.click('.wp-block-paragraph:last-child');
    await page.waitForTimeout(500);
    
    const newToolbarBox = await page.locator('.block-editor-block-toolbar').boundingBox();
    console.log(`📐 Toolbar position with second block: x=${newToolbarBox.x}, y=${newToolbarBox.y}`);

    // Test creating a heading block
    await page.keyboard.press('Enter');
    await page.keyboard.type('## This is a heading');
    
    // The block should auto-convert to heading
    await page.waitForTimeout(500);
    
    // Check toolbar for heading block
    const headingSelector = '.wp-block-heading, [data-type="core/heading"]';
    if (await page.locator(headingSelector).isVisible()) {
      await page.click(headingSelector);
      await page.waitForTimeout(500);
      
      const headingToolbarBox = await page.locator('.block-editor-block-toolbar').boundingBox();
      console.log(`📐 Toolbar position with heading block: x=${headingToolbarBox.x}, y=${headingToolbarBox.y}`);
    }

    // Take a final screenshot
    await page.screenshot({ path: 'detailed-block-toolbar-test.png' });

    console.log('✅ Detailed toolbar test completed successfully');

  } catch (error) {
    console.error('❌ Detailed test failed:', error);
    await page.screenshot({ path: 'detailed-toolbar-error.png' });
  } finally {
    await browser.close();
  }
}

testToolbarDetailed();