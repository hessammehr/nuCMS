import React, { useMemo } from 'react';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { Panel, PanelBody, PanelRow } from '@wordpress/components';
import './DocumentInspector.css';

interface DocumentInspectorProps {
  title?: string;
  wordCount?: number;
  readingTime?: number;
}

function DocumentInspector({ title, wordCount, readingTime }: DocumentInspectorProps) {
  // Get blocks from the block editor
  const blocks = useSelect(
    (select: any) => select('core/block-editor').getBlocks(),
    []
  );

  // Memoize the statistics calculation to prevent unnecessary rerenders
  const { characterCount, paragraphCount } = useMemo(() => {
    let chars = 0;
    let paragraphs = 0;
    
    const countBlockText = (block: any) => {
      if (block.name === 'core/paragraph' && block.attributes?.content) {
        // Remove HTML tags for character count
        const textContent = block.attributes.content.replace(/<[^>]*>/g, '');
        chars += textContent.length;
        if (textContent.trim()) paragraphs++;
      } else if (block.name === 'core/heading' && block.attributes?.content) {
        const textContent = block.attributes.content.replace(/<[^>]*>/g, '');
        chars += textContent.length;
      }
      
      // Recursively count inner blocks
      if (block.innerBlocks && block.innerBlocks.length > 0) {
        block.innerBlocks.forEach(countBlockText);
      }
    };
    
    blocks.forEach(countBlockText);
    
    return {
      characterCount: chars,
      paragraphCount: paragraphs,
    };
  }, [blocks]);

  // Calculate word count from character count (approximate)
  const estimatedWordCount = Math.ceil(characterCount / 5);
  const estimatedReadingTime = Math.max(1, Math.ceil(estimatedWordCount / 200));

  return (
    <div className="document-inspector">
      <Panel>
        <PanelBody title={__('Document')} initialOpen={true}>
          <PanelRow>
            <div className="document-inspector-stats">
              <div className="document-stat">
                <div className="document-stat-label">{__('Words')}</div>
                <div className="document-stat-value">{wordCount || estimatedWordCount}</div>
              </div>
              <div className="document-stat">
                <div className="document-stat-label">{__('Characters')}</div>
                <div className="document-stat-value">{characterCount}</div>
              </div>
              <div className="document-stat">
                <div className="document-stat-label">{__('Paragraphs')}</div>
                <div className="document-stat-value">{paragraphCount}</div>
              </div>
              <div className="document-stat">
                <div className="document-stat-label">{__('Blocks')}</div>
                <div className="document-stat-value">{blocks.length}</div>
              </div>
              <div className="document-stat">
                <div className="document-stat-label">{__('Reading time')}</div>
                <div className="document-stat-value">
                  {readingTime || estimatedReadingTime} {__('min')}
                </div>
              </div>
            </div>
          </PanelRow>
        </PanelBody>
        
        <PanelBody title={__('Document Outline')} initialOpen={false}>
          <PanelRow>
            <div className="document-outline">
              {blocks
                .filter((block: any) => block.name === 'core/heading')
                .map((block: any, index: number) => {
                  const level = block.attributes?.level || 2;
                  const content = block.attributes?.content?.replace(/<[^>]*>/g, '') || __('Empty heading');
                  return (
                    <div 
                      key={block.clientId || index}
                      className={`document-outline-item document-outline-item-h${level}`}
                      style={{ paddingLeft: `${(level - 1) * 16}px` }}
                    >
                      {content}
                    </div>
                  );
                })}
              {blocks.filter((block: any) => block.name === 'core/heading').length === 0 && (
                <p className="document-outline-empty">
                  {__('No headings found. Add headings to create a document outline.')}
                </p>
              )}
            </div>
          </PanelRow>
        </PanelBody>
      </Panel>
    </div>
  );
}

export default DocumentInspector;