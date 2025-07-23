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
  ToolbarButton,
  TabPanel
} from '@wordpress/components';
import { 
  InterfaceSkeleton,
  ComplementaryArea,
  store as interfaceStore
} from '@wordpress/interface';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { cog, close, undo as undoIcon, redo as redoIcon, plus, listView, wordpress } from '@wordpress/icons';
import DocumentInspector from './DocumentInspector';

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
        return parse(content);
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
  
  // Enable the inspector by default on first render
  useEffect(() => {
    enableComplementaryArea('core', 'edit-post/document');
  }, [enableComplementaryArea]);
  
  const isInspectorOpen = useSelect(
    (select: any) => {
      const { getActiveComplementaryArea } = select(interfaceStore);
      const activeArea = getActiveComplementaryArea('core');
      return activeArea === 'edit-post/document' || activeArea === 'edit-post/block';
    },
    []
  );

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


  const activeArea = useSelect(
    (select: any) => {
      const { getActiveComplementaryArea } = select(interfaceStore);
      return getActiveComplementaryArea('core');
    },
    []
  );

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
        const parsedBlocks = content ? parse(content) : [createBlock('core/paragraph')];
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

  return (
    <div className="gutenberg-fullscreen-editor">
      <SlotFillProvider>
        <BlockEditorProvider
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
                      label={__('WordPress')}
                      className="edit-post-header__logo"
                    />
                    <Inserter
                      position="bottom right"
                      showInserterHelpPanel={true}
                      __experimentalIsQuick={false}
                      className="edit-post-header__inserter"
                    />
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
                  {onExit && (
                    <Button
                      icon={close}
                      label={__('Exit')}
                      onClick={onExit}
                      className="edit-post-header__close-button"
                      variant="tertiary"
                    />
                  )}
                  {onSave && (
                    <>
                      <Button
                        variant="secondary"
                        onClick={onSave}
                        disabled={saving}
                        style={{ marginRight: '8px' }}
                      >
                        {saving ? __('Saving...') : (status === 'PUBLISHED' ? __('Update') : __('Save Draft'))}
                      </Button>
                      {status !== 'PUBLISHED' && onStatusChange && (
                        <Button
                          variant="primary"
                          onClick={() => {
                            onStatusChange('PUBLISHED');
                            if (onSave) onSave();
                          }}
                          disabled={saving}
                          style={{ marginRight: '8px' }}
                        >
                          {__('Publish')}
                        </Button>
                      )}
                    </>
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
            sidebar={(
              <div className="edit-post-sidebar">
                <TabPanel
                  className="edit-post-sidebar__panel-tabs"
                  activeClass="is-active"
                  orientation="horizontal"
                  tabs={[
                    {
                      name: 'document',
                      title: __('Document'),
                      className: 'edit-post-sidebar__panel-tab',
                    },
                    {
                      name: 'block',
                      title: __('Block'),
                      className: 'edit-post-sidebar__panel-tab',
                    },
                  ]}
                >
                  {(tab: { name: string; title: string; className: string }) => (
                    <div className="edit-post-sidebar__panel-tab-content">
                      {tab.name === 'document' && (
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
                      {tab.name === 'block' && <BlockInspector />}
                    </div>
                  )}
                </TabPanel>
              </div>
            )}
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
          <Popover.Slot />
        </BlockEditorProvider>
      </SlotFillProvider>
    </div>
  );
}

export default GutenbergEditor;
