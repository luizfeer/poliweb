import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
  'a',
  'b',
  'blockquote',
  'br',
  'code',
  'div',
  'em',
  'figcaption',
  'figure',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'i',
  'img',
  'li',
  'mark',
  'ol',
  'p',
  'pre',
  'small',
  'span',
  'strong',
  'sub',
  'sup',
  'u',
  'ul',
];

const ALLOWED_ATTR = [
  'alt',
  'class',
  'height',
  'href',
  'loading',
  'rel',
  'src',
  'srcset',
  'style',
  'target',
  'title',
  'width',
];

/**
 * Versao client-side da sanitizacao usada apenas no preview do editor admin.
 * O render publico SEMPRE usa `sanitize-raw-html.ts` no servidor.
 */
export function sanitizeRawHtmlPreview(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
  });
}
