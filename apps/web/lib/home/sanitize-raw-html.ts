import 'server-only';

import sanitizeHtml from 'sanitize-html';

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
 * Sanitiza HTML editado pelo admin antes de renderizar na home.
 * Sempre executar no servidor — nao confiar no que esta no DB.
 *
 * - bloqueia `<script>`, handlers `on*`, `javascript:` urls
 * - libera tags inline + estrutura basica + img
 * - forca `rel="noopener noreferrer"` em todo link externo
 * - forca `loading="lazy"` em img
 */
export function sanitizeHomeRawHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      '*': ALLOWED_ATTR,
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesByTag: {
      img: ['http', 'https', 'data'],
    },
    allowProtocolRelative: false,
    transformTags: {
      a: (_tagName, attribs) => ({
        tagName: 'a',
        attribs: {
          ...attribs,
          target: attribs.target ?? '_blank',
          rel: attribs.rel ?? 'noopener noreferrer',
        },
      }),
      img: (_tagName, attribs) => ({
        tagName: 'img',
        attribs: {
          ...attribs,
          loading: attribs.loading ?? 'lazy',
        },
      }),
    },
  });
}
