import { registerCoreBlocks } from '@wordpress/block-library';
import { dispatch } from '@wordpress/data';
import { addFilter } from '@wordpress/hooks';
import { store as interfaceStore } from '@wordpress/interface';
import * as blocks from '@wordpress/blocks';
import * as data from '@wordpress/data';
import * as element from '@wordpress/element';
import * as components from '@wordpress/components';
import * as blockEditor from '@wordpress/block-editor';
import * as i18n from '@wordpress/i18n';
import * as hooks from '@wordpress/hooks';

let isInitialized = false;

export function initializeWordPress() {
  if (isInitialized) return;

  try {
    // Register all core WordPress blocks
    registerCoreBlocks();
    
    // The interface store is automatically registered by WordPress packages
    
    // Add custom block filters for better WordPress compatibility
    addFilter(
      'blocks.registerBlockType',
      'nucms/enhance-blocks',
      (settings: any, name: string) => {
        // Enhance block settings for better compatibility
        if (name.startsWith('core/')) {
          return {
            ...settings,
            // Enable all WordPress features
            supports: {
              ...settings.supports,
              anchor: true,
              className: true,
              customClassName: true,
              html: false,
            },
          };
        }
        return settings;
      }
    );

    // Set up global WordPress-like behavior
    if (typeof window !== 'undefined') {
      // Add WordPress globals that some blocks might expect
      (window as any).wp = {
        blocks,
        data,
        element,
        components,
        blockEditor,
        i18n,
        hooks,
      };
    }

    isInitialized = true;
    console.log('✅ WordPress utilities initialized with Gutenberg blocks and enhanced compatibility');
  } catch (error) {
    console.error('❌ Failed to initialize WordPress utilities:', error);
  }
}
