import React, { useState, useEffect, useRef } from 'react';
import { serialize, parse, createBlock } from '@wordpress/blocks';
import { 
  BlockEditorProvider, 
  BlockEditorKeyboardShortcuts, 
  WritingFlow, 
  ObserveTyping, 
  BlockList,
  BlockInspector,
  BlockToolbar
} from '@wordpress/block-editor';
import { Popover, SlotFillProvider, ToolbarGroup, ToolbarButton } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';

interface GutenbergEditorProps {
  content: string;
  onChange: (content: string) => void;
}

function GutenbergEditor({ content, onChange }: GutenbergEditorProps) {
  const [blocks, setBlocks] = useState(() => {
    try {
      return content ? parse(content) : [createBlock('core/paragraph')];
    } catch (error) {
      console.warn('Failed to parse content as blocks, starting with empty paragraph:', error);
      return [createBlock('core/paragraph')];
    }
  });

  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const parsedBlocks = content ? parse(content) : [createBlock('core/paragraph')];
      setBlocks(parsedBlocks);
    } catch (error) {
      console.warn('Failed to parse content as blocks:', error);
      setBlocks([createBlock('core/paragraph')]);
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
    <SlotFillProvider>
      <div className="gutenberg-editor" style={{ border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#fff' }}>
        <BlockEditorProvider
          value={blocks}
          onInput={updateBlocks}
          onChange={updateBlocks}
        >
          <div className="editor-styles-wrapper" ref={editorRef}>
            <BlockEditorKeyboardShortcuts.Register />
            <BlockToolbar hideDragHandle />
            <WritingFlow>
              <ObserveTyping>
                <div className="wp-block-editor__content" style={{ padding: '1rem', minHeight: '400px' }}>
                  <BlockList />
                </div>
              </ObserveTyping>
            </WritingFlow>
          </div>
          <Popover.Slot />
        </BlockEditorProvider>
      </div>
    </SlotFillProvider>
  );
}

export default GutenbergEditor;
