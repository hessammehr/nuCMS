import React, { useState, useEffect, useRef, useMemo } from 'react';
import { serialize, parse } from '@wordpress/blocks';
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
  BlockBreadcrumb
} from '@wordpress/block-editor';
import { 
  Popover, 
  SlotFillProvider,
  Button
} from '@wordpress/components';
import { 
  InterfaceSkeleton,
  ComplementaryArea,
  store as interfaceStore
} from '@wordpress/interface';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { cog, close } from '@wordpress/icons';

interface GutenbergEditorProps {
  content: string;
  onChange: (content: string) => void;
  title?: string;
  onTitleChange?: (title: string) => void;
  onSave?: () => void;
  saving?: boolean;
}

function GutenbergEditor({ content, onChange, title, onTitleChange, onSave, saving }: GutenbergEditorProps) {
  const [blocks, setBlocks] = useState(() => {
    try {
      return content ? parse(content) : [];
    } catch (error) {
      console.warn('Failed to parse content as blocks, starting with empty editor:', error);
      return [];
    }
  });

  const { enableComplementaryArea, disableComplementaryArea } = useDispatch(interfaceStore);
  
  const isInspectorOpen = useSelect(
    (select) => {
      const { getActiveComplementaryArea } = select(interfaceStore);
      return getActiveComplementaryArea('core') === 'edit-post/block';
    },
    []
  );

  const toggleInspector = () => {
    if (isInspectorOpen) {
      disableComplementaryArea('core');
    } else {
      enableComplementaryArea('core', 'edit-post/block');
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

  useEffect(() => {
    try {
      const parsedBlocks = content ? parse(content) : [];
      setBlocks(parsedBlocks);
    } catch (error) {
      console.warn('Failed to parse content as blocks:', error);
      setBlocks([]);
    }
  }, [content]);

  const updateBlocks = (newBlocks: any[]) => {
    setBlocks(newBlocks);
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
            header={
              <div className="edit-post-header">
                <div className="edit-post-header__settings">
                  {onSave && (
                    <Button
                      variant="primary"
                      onClick={onSave}
                      disabled={saving}
                    >
                      {saving ? __('Saving...') : __('Save')}
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
            sidebar={isInspectorOpen && (
              <div style={{ width: '280px', background: '#fff', borderLeft: '1px solid #e0e0e0', height: '100%' }}>
                <div style={{ padding: '16px', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ margin: 0, fontSize: '13px', fontWeight: '600' }}>
                    {__('Block Settings')}
                  </h2>
                  <Button
                    icon={close}
                    label={__('Close Settings')}
                    onClick={toggleInspector}
                    isSmall
                  />
                </div>
                <div style={{ padding: '16px', overflow: 'auto', height: 'calc(100% - 60px)' }}>
                  <BlockInspector />
                </div>
              </div>
            )}
            content={
              <div className="edit-post-visual-editor">
                <div className="edit-post-visual-editor__content-area">
                  <div className="wp-block-editor__content">
                    <div style={{ maxWidth: '840px', margin: '0 auto', padding: '40px 20px' }}>
                      {onTitleChange && (
                        <div className="edit-post-post-title" style={{ marginBottom: '40px' }}>
                          <textarea
                            value={title || ''}
                            onChange={(e) => onTitleChange(e.target.value)}
                            placeholder={__('Add title')}
                            className="edit-post-post-title__input"
                            style={{
                              width: '100%',
                              border: 'none',
                              outline: 'none',
                              background: 'transparent',
                              resize: 'none',
                              fontFamily: 'inherit',
                              fontSize: '40px',
                              fontWeight: 'bold',
                              lineHeight: '1.2',
                              color: '#1e1e1e',
                              padding: '0',
                              margin: '0',
                              minHeight: '50px',
                              overflow: 'hidden'
                            }}
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
                      <BlockSelectionClearer className="edit-post-visual-editor__post-title-wrapper">
                        <BlockToolbar hideDragHandle />
                        <WritingFlow>
                          <ObserveTyping>
                            <BlockList className="edit-post-visual-editor__content" />
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
