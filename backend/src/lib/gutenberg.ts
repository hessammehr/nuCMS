import { parse } from '@wordpress/block-serialization-default-parser';
import type { GutenbergBlock } from '../../../shared/types';

export function parseGutenbergBlocks(content: string): GutenbergBlock[] {
  return parse(content) as GutenbergBlock[];
}

export function renderGutenbergBlock(block: GutenbergBlock): string {
  const { blockName, attrs = {}, innerHTML, innerBlocks } = block;

  // Handle null blocks (freeform content)
  if (!blockName) {
    return innerHTML || '';
  }

  // Render inner blocks recursively
  const innerContent = innerBlocks.map(renderGutenbergBlock).join('');

  switch (blockName) {
    case 'core/paragraph':
      const alignment = attrs.align ? ` style="text-align: ${attrs.align}"` : '';
      const className = attrs.className ? ` class="${attrs.className}"` : '';
      return `<p${className}${alignment}>${innerHTML}</p>`;

    case 'core/heading':
      const level = attrs.level || 2;
      const headingClass = attrs.className ? ` class="${attrs.className}"` : '';
      const headingAlign = attrs.textAlign ? ` style="text-align: ${attrs.textAlign}"` : '';
      return `<h${level}${headingClass}${headingAlign}>${innerHTML}</h${level}>`;

    case 'core/image':
      const src = attrs.url || attrs.src || '';
      const alt = attrs.alt || '';
      const caption = attrs.caption || '';
      const id = attrs.id ? ` id="wp-image-${attrs.id}"` : '';
      const classes = ['wp-image'];
      if (attrs.className) classes.push(attrs.className);
      if (attrs.sizeSlug) classes.push(`size-${attrs.sizeSlug}`);
      
      let imageHtml = `<img${id} src="${src}" alt="${alt}" class="${classes.join(' ')}" />`;
      
      if (caption) {
        imageHtml = `<figure class="wp-block-image">${imageHtml}<figcaption>${caption}</figcaption></figure>`;
      } else {
        imageHtml = `<figure class="wp-block-image">${imageHtml}</figure>`;
      }
      
      return imageHtml;

    case 'core/list':
      const ordered = attrs.ordered || false;
      const tag = ordered ? 'ol' : 'ul';
      const listClass = attrs.className ? ` class="${attrs.className}"` : '';
      return `<${tag}${listClass}>${innerHTML}</${tag}>`;

    case 'core/list-item':
      return `<li>${innerHTML}</li>`;

    case 'core/quote':
      const quoteClass = attrs.className ? ` class="wp-block-quote ${attrs.className}"` : ' class="wp-block-quote"';
      return `<blockquote${quoteClass}>${innerHTML}</blockquote>`;

    case 'core/code':
      const codeClass = attrs.className ? ` class="wp-block-code ${attrs.className}"` : ' class="wp-block-code"';
      return `<pre${codeClass}><code>${innerHTML}</code></pre>`;

    case 'core/preformatted':
      const preClass = attrs.className ? ` class="wp-block-preformatted ${attrs.className}"` : ' class="wp-block-preformatted"';
      return `<pre${preClass}>${innerHTML}</pre>`;

    case 'core/columns':
      const columnsClass = attrs.className ? ` class="wp-block-columns ${attrs.className}"` : ' class="wp-block-columns"';
      return `<div${columnsClass}>${innerContent}</div>`;

    case 'core/column':
      const columnClass = attrs.className ? ` class="wp-block-column ${attrs.className}"` : ' class="wp-block-column"';
      const width = attrs.width ? ` style="flex-basis: ${attrs.width}"` : '';
      return `<div${columnClass}${width}>${innerContent}</div>`;

    case 'core/group':
      const groupClass = attrs.className ? ` class="wp-block-group ${attrs.className}"` : ' class="wp-block-group"';
      return `<div${groupClass}>${innerContent}</div>`;

    case 'core/media-text':
      const mediaTextClass = attrs.className ? ` class="wp-block-media-text ${attrs.className}"` : ' class="wp-block-media-text"';
      return `<div${mediaTextClass}>${innerContent}</div>`;

    case 'core/embed':
    case 'core-embed/youtube':
    case 'core-embed/vimeo':
      const embedClass = attrs.className ? ` class="wp-block-embed ${attrs.className}"` : ' class="wp-block-embed"';
      const url = attrs.url || '';
      return `<figure${embedClass}><div class="wp-block-embed__wrapper">${innerHTML || url}</div></figure>`;

    case 'core/separator':
      const separatorClass = attrs.className ? ` class="wp-block-separator ${attrs.className}"` : ' class="wp-block-separator"';
      return `<hr${separatorClass} />`;

    case 'core/spacer':
      const height = attrs.height ? ` style="height: ${attrs.height}px"` : '';
      const spacerClass = attrs.className ? ` class="wp-block-spacer ${attrs.className}"` : ' class="wp-block-spacer"';
      return `<div${spacerClass}${height}></div>`;

    case 'core/button':
      const buttonText = innerHTML || attrs.text || '';
      const buttonUrl = attrs.url || '#';
      const buttonClass = ['wp-block-button__link'];
      if (attrs.className) buttonClass.push(attrs.className);
      return `<div class="wp-block-button"><a class="${buttonClass.join(' ')}" href="${buttonUrl}">${buttonText}</a></div>`;

    case 'core/buttons':
      const buttonsClass = attrs.className ? ` class="wp-block-buttons ${attrs.className}"` : ' class="wp-block-buttons"';
      return `<div${buttonsClass}>${innerContent}</div>`;

    default:
      // Fallback for unknown blocks - wrap in div with block class
      const fallbackClass = `wp-block-${blockName.replace('/', '-')}`;
      const customClass = attrs.className ? ` ${attrs.className}` : '';
      return `<div class="${fallbackClass}${customClass}">${innerHTML}${innerContent}</div>`;
  }
}

export function renderGutenbergContent(content: string): string {
  try {
    const blocks = parseGutenbergBlocks(content);
    return blocks.map(renderGutenbergBlock).join('\n');
  } catch (error) {
    console.error('Error rendering Gutenberg content:', error);
    return content; // Fallback to original content
  }
}

export function extractSEOData(content: string) {
  try {
    const blocks = parseGutenbergBlocks(content);
    let description = '';
    let wordCount = 0;
    
    function extractText(block: GutenbergBlock): string {
      let text = '';
      
      // Extract text from innerHTML (strip HTML tags)
      if (block.innerHTML) {
        text += block.innerHTML.replace(/<[^>]*>/g, ' ').trim() + ' ';
      }
      
      // Process inner blocks recursively
      block.innerBlocks?.forEach(innerBlock => {
        text += extractText(innerBlock);
      });
      
      return text;
    }
    
    const fullText = blocks.map(extractText).join(' ').trim();
    const words = fullText.split(/\s+/).filter(word => word.length > 0);
    wordCount = words.length;
    
    // Generate description from first paragraph or first 160 characters
    description = fullText.slice(0, 160);
    if (description.length === 160) {
      description = description.slice(0, description.lastIndexOf(' ')) + '...';
    }
    
    // Calculate reading time (average 200 words per minute)
    const readingTime = Math.ceil(wordCount / 200);
    
    return {
      description,
      wordCount,
      readingTime,
      keywords: extractKeywords(fullText)
    };
  } catch (error) {
    console.error('Error extracting SEO data:', error);
    return {
      description: '',
      wordCount: 0,
      readingTime: 0,
      keywords: []
    };
  }
}

function extractKeywords(text: string): string[] {
  // Simple keyword extraction - remove common words and get most frequent
  const commonWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those'
  ]);
  
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.has(word));
  
  const wordCount = words.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return Object.entries(wordCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);
}
