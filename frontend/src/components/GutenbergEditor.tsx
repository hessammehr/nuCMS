import React, { useState, useEffect, useRef, useMemo } from 'react';
import { serialize, parse, createBlock } from '@wordpress/blocks';
import { 
  BlockEditorProvider, 
  BlockEditorKeyboardShortcuts, 
  WritingFlow, 
  ObserveTyping, 
  BlockList,
  BlockInspector,
  BlockToolbar,
  BlockSelectionClearer,
  __unstableEditorStyles as EditorStyles,
  BlockBreadcrumb,
  Inserter
} from '@wordpress/block-editor';
import { 
  Popover, 
  SlotFillProvider,
  Button,
  ToolbarGroup,
  ToolbarButton
} from '@wordpress/components';
import { 
  InterfaceSkeleton,
  ComplementaryArea,
  store as interfaceStore
} from '@wordpress/interface';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { cog, close, undo as undoIcon, redo as redoIcon, plus, listView, wordpress } from '@wordpress/icons';
import { CommandMenu, useCommand } from '@wordpress/commands';
import DocumentInspector from './DocumentInspector';
import { createMediaUpload, createMediaSelect } from '../utils/media';

interface GutenbergEditorProps {
  content: string;
  onChange: (content: string) => void;
  title?: string;
  onTitleChange?: (title: string) => void;
  onSave?: () => void;
  saving?: boolean;
  slug?: string;
  excerpt?: string;
  status?: string;
  onSlugChange?: (slug: string) => void;
  onExcerptChange?: (excerpt: string) => void;
  onStatusChange?: (status: string) => void;
  onExit?: () => void;
}

function GutenbergEditor({ 
  content, 
  onChange, 
  title, 
  onTitleChange, 
  onSave, 
  saving, 
  slug, 
  excerpt, 
  status, 
  onSlugChange, 
  onExcerptChange, 
  onStatusChange,
  onExit
}: GutenbergEditorProps) {
  const [blocks, setBlocks] = useState(() => {
    try {
      if (content) {
        const parsedBlocks = parse(content);
        return parsedBlocks.length > 0 ? parsedBlocks : [createBlock('core/paragraph')];
      } else {
        // Start with a default paragraph block when no content exists
        return [createBlock('core/paragraph')];
      }
    } catch (error) {
      console.warn('Failed to parse content as blocks, starting with default paragraph:', error);
      return [createBlock('core/paragraph')];
    }
  });

  const { enableComplementaryArea, disableComplementaryArea } = useDispatch(interfaceStore);
  const { resetBlocks, insertDefaultBlock } = useDispatch('core/block-editor');
  
  const activeArea = useSelect(
    (select: any) => {
      const { getActiveComplementaryArea } = select(interfaceStore);
      return getActiveComplementaryArea('core');
    },
    []
  );

  const isInspectorOpen = useSelect(
    (select: any) => {
      const { getActiveComplementaryArea } = select(interfaceStore);
      const activeArea = getActiveComplementaryArea('core');
      return activeArea === 'edit-post/document' || activeArea === 'edit-post/block';
    },
    []
  );

  // Enable the inspector by default on first render, but only if no area is already active
  useEffect(() => {
    if (!activeArea) {
      enableComplementaryArea('core', 'edit-post/document');
    }
  }, [enableComplementaryArea, activeArea]);

  // Ensure the block editor store is properly initialized with our blocks
  useEffect(() => {
    if (resetBlocks && blocks.length > 0) {
      console.log('🔄 Syncing blocks to WordPress data store:', blocks.length);
      resetBlocks(blocks);
    } else if (insertDefaultBlock && blocks.length === 0) {
      console.log('📝 Inserting default block');
      insertDefaultBlock();
    }
  }, [resetBlocks, insertDefaultBlock, blocks]);

  // Undo/Redo functionality - memoized to prevent unnecessary rerenders
  const { hasUndo, hasRedo } = useSelect(
    (select: any) => {
      try {
        const blockEditorSelect = select('core/block-editor');
        if (blockEditorSelect && blockEditorSelect.hasUndo && blockEditorSelect.hasRedo) {
          return {
            hasUndo: blockEditorSelect.hasUndo(),
            hasRedo: blockEditorSelect.hasRedo()
          };
        }
      } catch (error) {
        console.warn('Block editor store not available for undo/redo');
      }
      
      // Fallback - always return consistent object structure
      return {
        hasUndo: false,
        hasRedo: false
      };
    },
    []
  );

  const { undo, redo } = useDispatch('core/block-editor');

  const toggleInspector = () => {
    if (isInspectorOpen) {
      disableComplementaryArea('core');
    } else {
      enableComplementaryArea('core', 'edit-post/document');
    }
  };

  // Editor settings that match WordPress defaults
  const editorSettings = useMemo(() => ({
    alignWide: true,
    supportsLayout: true,
    disableCustomColors: false,
    disableCustomFontSizes: false,
    disableCustomGradients: false,
    enableCustomLineHeight: true,
    enableCustomSpacing: true,
    enableCustomUnits: true,
    // Media upload settings
    mediaUpload: createMediaUpload(),
    mediaLibrary: createMediaSelect(),
    colors: [
      { name: 'Black', slug: 'black', color: '#000000' },
      { name: 'Cyan bluish gray', slug: 'cyan-bluish-gray', color: '#abb8c3' },
      { name: 'White', slug: 'white', color: '#ffffff' },
      { name: 'Pale pink', slug: 'pale-pink', color: '#f78da7' },
      { name: 'Vivid red', slug: 'vivid-red', color: '#cf2e2e' },
      { name: 'Luminous vivid orange', slug: 'luminous-vivid-orange', color: '#ff6900' },
      { name: 'Luminous vivid amber', slug: 'luminous-vivid-amber', color: '#fcb900' },
      { name: 'Light green cyan', slug: 'light-green-cyan', color: '#7bdcb5' },
      { name: 'Vivid green cyan', slug: 'vivid-green-cyan', color: '#00d084' },
      { name: 'Pale cyan blue', slug: 'pale-cyan-blue', color: '#8ed1fc' },
      { name: 'Vivid cyan blue', slug: 'vivid-cyan-blue', color: '#0693e3' },
      { name: 'Vivid purple', slug: 'vivid-purple', color: '#9b51e0' },
    ],
    fontSizes: [
      { name: 'Small', slug: 'small', size: '13px' },
      { name: 'Normal', slug: 'normal', size: '16px' },
      { name: 'Medium', slug: 'medium', size: '20px' },
      { name: 'Large', slug: 'large', size: '36px' },
      { name: 'Huge', slug: 'huge', size: '42px' },
    ],
    gradients: [
      {
        name: 'Vivid cyan blue to vivid purple',
        gradient: 'linear-gradient(135deg,rgba(6,147,227,1) 0%,rgb(155,81,224) 100%)',
        slug: 'vivid-cyan-blue-to-vivid-purple',
      },
      {
        name: 'Light green cyan to vivid green cyan',
        gradient: 'linear-gradient(135deg,rgb(122,220,180) 0%,rgb(0,208,130) 100%)',
        slug: 'light-green-cyan-to-vivid-green-cyan',
      },
      {
        name: 'Luminous vivid amber to luminous vivid orange',
        gradient: 'linear-gradient(135deg,rgba(252,185,0,1) 0%,rgba(255,105,0,1) 100%)',
        slug: 'luminous-vivid-amber-to-luminous-vivid-orange',
      },
      {
        name: 'Luminous vivid orange to vivid red',
        gradient: 'linear-gradient(135deg,rgba(255,105,0,1) 0%,rgb(207,46,46) 100%)',
        slug: 'luminous-vivid-orange-to-vivid-red',
      },
    ],
    __experimentalFeatures: {
      typography: {
        lineHeight: true,
        fontSize: true,
        fontStyle: true,
        fontWeight: true,
        letterSpacing: true,
        textDecoration: true,
        textTransform: true,
      },
      spacing: {
        margin: true,
        padding: true,
        blockGap: true,
      },
      color: {
        text: true,
        background: true,
        link: true,
        palette: true,
        gradients: true,
      },
      border: {
        color: true,
        radius: true,
        style: true,
        width: true,
      },
    },
  }), []);

  const isInternalUpdate = useRef(false);
  
  useEffect(() => {
    if (!isInternalUpdate.current) {
      try {
        let parsedBlocks;
        if (content) {
          parsedBlocks = parse(content);
          // Ensure we always have at least one block
          if (parsedBlocks.length === 0) {
            parsedBlocks = [createBlock('core/paragraph')];
          }
        } else {
          parsedBlocks = [createBlock('core/paragraph')];
        }
        setBlocks(parsedBlocks);
      } catch (error) {
        console.warn('Failed to parse content as blocks:', error);
        setBlocks([createBlock('core/paragraph')]);
      }
    }
    isInternalUpdate.current = false;
  }, [content]);

  const updateBlocks = (newBlocks: any[]) => {
    setBlocks(newBlocks);
    isInternalUpdate.current = true;
    try {
      const serializedContent = serialize(newBlocks);
      onChange(serializedContent);
    } catch (error) {
      console.error('Failed to serialize blocks:', error);
    }
  };

  // Debug logging to help understand the data flow
  useEffect(() => {
    console.log('🔍 Editor blocks state:', {
      blocksCount: blocks.length,
      blocks: blocks.map(block => ({ name: block.name, clientId: block.clientId, isValid: block.isValid })),
      content,
      serialized: blocks.length > 0 ? serialize(blocks) : 'no blocks'
    });
  }, [blocks, content]);

  return (
    <div className="gutenberg-fullscreen-editor">
      <SlotFillProvider>
        <BlockEditorProvider
          key={blocks.length > 0 ? blocks[0].clientId : 'empty'}
          value={blocks}
          onInput={updateBlocks}
          onChange={updateBlocks}
          settings={editorSettings}
        >
          <InterfaceSkeleton
            labels={{
              header: __('Editor top bar'),
              body: __('Editor content'),
              sidebar: __('Editor settings'),
              actions: __('Editor publish'),
              footer: __('Editor footer'),
            }}
            enableRegionNavigation={false}
            className={isInspectorOpen ? 'has-sidebar' : ''}
            header={
              <div className="edit-post-header">
                <div className="edit-post-header__toolbar">
                  <ToolbarGroup className="edit-post-header__toolbar-left">
                    <ToolbarButton
                      icon={wordpress}
                      label={__('nuCMS Dashboard')}
                      className="edit-post-header__logo"
                      onClick={onExit}
                    />
                    <div className="edit-post-header__inserter">
                      <Inserter
                        position="bottom right"
                        showInserterHelpPanel={true}
                        __experimentalIsQuick={false}
                      />
                    </div>
                    <ToolbarButton
                      icon={undoIcon}
                      label={__('Undo')}
                      shortcut="Ctrl+Z"
                      onClick={() => undo && undo()}
                      disabled={!hasUndo}
                    />
                    <ToolbarButton
                      icon={redoIcon}
                      label={__('Redo')}
                      shortcut="Ctrl+Y"
                      onClick={() => redo && redo()}
                      disabled={!hasRedo}
                    />
                    <ToolbarButton
                      icon={listView}
                      label={__('List View')}
                      shortcut="Ctrl+Shift+Alt+O"
                    />
                  </ToolbarGroup>
                </div>
                <div className="edit-post-header__center">
                  <div className="edit-post-header__document-title">
                    <span>{title ? title : __('Say Hello to Gutenberg, the WordPress Edit...')}</span>
                    <span className="edit-post-header__document-shortcut">⌘K</span>
                  </div>
                </div>
                <div className="edit-post-header__settings">
                  {onSave && (
                    <Button
                      variant="secondary"
                      onClick={onSave}
                      disabled={saving}
                    >
                      {saving ? __('Saving...') : (status === 'PUBLISHED' ? __('Update') : __('Save Draft'))}
                    </Button>
                  )}
                  <Button
                    icon={cog}
                    label={__('Settings')}
                    onClick={toggleInspector}
                    isPressed={isInspectorOpen}
                  />
                </div>
              </div>
            }
            sidebar={isInspectorOpen ? (
              <div className="edit-post-sidebar">
                <div className="edit-post-sidebar__header">
                  <div className="edit-post-sidebar__tabs">
                    <button
                      className={`edit-post-sidebar__tab ${activeArea === 'edit-post/document' ? 'is-active' : ''}`}
                      onClick={() => enableComplementaryArea('core', 'edit-post/document')}
                      type="button"
                    >
                      {__('Document')}
                    </button>
                    <button
                      className={`edit-post-sidebar__tab ${activeArea === 'edit-post/block' ? 'is-active' : ''}`}
                      onClick={() => enableComplementaryArea('core', 'edit-post/block')}
                      type="button"
                    >
                      {__('Block')}
                    </button>
                  </div>
                </div>
                <div className="edit-post-sidebar__panel-tab-content">
                  {activeArea === 'edit-post/document' && (
                    <DocumentInspector 
                      title={title}
                      slug={slug}
                      excerpt={excerpt}
                      status={status}
                      onSlugChange={onSlugChange}
                      onExcerptChange={onExcerptChange}
                      onStatusChange={onStatusChange}
                    />
                  )}
                  {activeArea === 'edit-post/block' && <BlockInspector />}
                </div>
              </div>
            ) : null}
            content={
              <div className="interface-interface-skeleton__content">
                <div className="edit-post-visual-editor">
                  <div className="edit-post-visual-editor__content-area">
                    <div className="edit-post-visual-editor__post-title-wrapper">
                      {onTitleChange && (
                        <div className="edit-post-post-title">
                          <textarea
                            value={title || ''}
                            onChange={(e) => onTitleChange(e.target.value)}
                            placeholder={__('Add title')}
                            className="edit-post-post-title__input"
                            rows={1}
                            onInput={(e) => {
                              const target = e.target as HTMLTextAreaElement;
                              target.style.height = 'auto';
                              target.style.height = target.scrollHeight + 'px';
                            }}
                          />
                        </div>
                      )}
                      <EditorStyles styles={[]} />
                      <BlockSelectionClearer className="block-editor-writing-flow">
                        <BlockEditorKeyboardShortcuts />
                        <BlockToolbar hideDragHandle />
                        <WritingFlow>
                          <ObserveTyping>
                            <BlockList />
                          </ObserveTyping>
                        </WritingFlow>
                      </BlockSelectionClearer>
                    </div>
                  </div>
                </div>
              </div>
            }
            footer={<BlockBreadcrumb />}
          />
          <BlockEditorKeyboardShortcuts.Register />
          <CommandMenu />
          <Popover.Slot />
        </BlockEditorProvider>
      </SlotFillProvider>
    </div>
  );
}

export default GutenbergEditor;
