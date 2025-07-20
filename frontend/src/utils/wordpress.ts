import { registerCoreBlocks } from '@wordpress/block-library';
import { dispatch } from '@wordpress/data';

let isInitialized = false;

export function initializeWordPress() {
  if (isInitialized) return;

  try {
    // Register all core WordPress blocks
    registerCoreBlocks();
    
    // Configure the block editor settings
    const editorSettings = {
      alignWide: true,
      supportsLayout: true,
      colors: [
        { name: 'White', slug: 'white', color: '#ffffff' },
        { name: 'Black', slug: 'black', color: '#000000' },
        { name: 'Gray', slug: 'gray', color: '#6b7280' },
        { name: 'Blue', slug: 'blue', color: '#3b82f6' },
        { name: 'Green', slug: 'green', color: '#10b981' },
        { name: 'Red', slug: 'red', color: '#ef4444' },
      ],
      fontSizes: [
        { name: 'Small', slug: 'small', size: '14px' },
        { name: 'Medium', slug: 'medium', size: '16px' },
        { name: 'Large', slug: 'large', size: '20px' },
        { name: 'Extra Large', slug: 'x-large', size: '24px' },
      ],
      enableCustomColors: true,
      enableCustomFontSizes: true,
    };

    // Initialize the block editor store with settings
    if (dispatch('core/block-editor')) {
      dispatch('core/block-editor').updateSettings(editorSettings);
    }

    isInitialized = true;
    console.log('✅ WordPress utilities initialized with Gutenberg blocks');
  } catch (error) {
    console.error('❌ Failed to initialize WordPress utilities:', error);
  }
}
