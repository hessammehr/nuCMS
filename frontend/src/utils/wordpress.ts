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
import * as React from 'react';
import { createMediaUpload, createMediaSelect } from './media';

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

    // Add filter to add Media Library button to image block
    addFilter(
      'editor.BlockEdit',
      'nucms/add-media-library-button',
      (BlockEdit: any) => {
        return (props: any) => {
          // For image blocks, add media library functionality
          if (props.name === 'core/image') {
            console.log('🎨 Rendering image block with Media Library button');
            
            // Create the original block element
            const originalElement = React.createElement(BlockEdit, props);
            
            // If the image block is in placeholder state (no image selected), add media library button
            if (!props.attributes.id && !props.attributes.url) {
              console.log('🖼️ Image block in placeholder state, adding Media Library option');
              
              // Wrap the original element and add media library functionality
              return React.createElement('div', { className: 'nucms-image-block-wrapper' }, [
                originalElement,
                React.createElement('div', { 
                  key: 'media-library-wrapper',
                  className: 'nucms-media-library-wrapper',
                  style: { marginTop: '10px', textAlign: 'center' }
                }, [
                  React.createElement('button', {
                    key: 'media-library-btn',
                    className: 'components-button is-secondary',
                    onClick: () => {
                      console.log('📚 Media Library button clicked');
                      const mediaSelect = createMediaSelect();
                      mediaSelect({
                        allowedTypes: ['image/*'],
                        multiple: false,
                        onSelect: (media: any) => {
                          console.log('📚 Media selected from library:', media);
                          // Update the block attributes with selected media
                          props.setAttributes({
                            id: media.id,
                            url: media.url,
                            alt: media.alt || '',
                            caption: media.caption || '',
                          });
                        }
                      });
                    }
                  }, 'Media Library')
                ])
              ]);
            }
            
            return originalElement;
          }
          return React.createElement(BlockEdit, props);
        };
      },
      20
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
        media: {
          upload: createMediaUpload(),
          select: createMediaSelect(),
          // Add proper WordPress media frame for image blocks
          view: {
            MediaFrame: {
              Select: function(options = {}) {
                console.log('📚 WordPress MediaFrame.Select called with options:', options);
                return {
                  open: () => {
                    console.log('📚 MediaFrame.Select.open called');
                    const mediaSelect = createMediaSelect();
                    mediaSelect({
                      allowedTypes: options.allowedTypes || ['image/*'],
                      multiple: options.multiple || false,
                      onSelect: (media) => {
                        console.log('📚 Media selected via MediaFrame:', media);
                        if (options.onSelect) {
                          options.onSelect(media);
                        }
                      }
                    });
                  }
                };
              }
            }
          },
          // WordPress.com-style media function expected by some blocks
          frame: function(options = {}) {
            console.log('📚 WordPress wp.media.frame called with options:', options);
            const frame = {
              open: () => {
                console.log('📚 Media frame open called');
                const mediaSelect = createMediaSelect();
                mediaSelect({
                  allowedTypes: options.allowedTypes || ['image/*'],
                  multiple: options.multiple || false,
                  onSelect: (media) => {
                    console.log('📚 Media selected via frame:', media);
                    if (options.onSelect) {
                      options.onSelect(media);
                    }
                  }
                });
              }
            };
            return frame;
          }
        },
      };
    }

    isInitialized = true;
    console.log('✅ WordPress utilities initialized with Gutenberg blocks and enhanced compatibility');
  } catch (error) {
    console.error('❌ Failed to initialize WordPress utilities:', error);
  }
}
