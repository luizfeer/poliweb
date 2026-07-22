/** Detecta formatação inline/blocos usados pelo assistente. */
export const SIMPLE_MARKDOWN_PATTERN =
  /(\*\*[^*]+\*\*|\*[^*]+\*|^#{1,3}\s|^[-*•]\s)/m;

export function hasSimpleMarkdown(text: string): boolean {
  return SIMPLE_MARKDOWN_PATTERN.test(text);
}

/** Remove marcação simples para cópia/compartilhamento. */
export function stripSimpleMarkdown(text: string): string {
  return text
    .replace(/^#{1,3}\s+/gm, '')
    .replace(/^[-*•]\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .trim();
}
