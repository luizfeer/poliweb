import type { RawHtmlConfig } from '@/lib/home';
import { sanitizeHomeRawHtml } from '@/lib/home/sanitize-raw-html';

type Props = {
  config: RawHtmlConfig;
  title: string | null;
};

const PADDING_CLASS: Record<NonNullable<RawHtmlConfig['padding']>, string> = {
  none: '',
  tight: 'px-4 md:px-6',
  comfortable: 'px-4 py-4 md:px-8 md:py-6',
};

export function RawHtmlBlock({ config, title }: Props) {
  const html = typeof config?.html === 'string' ? config.html : '';
  if (!html.trim()) return null;

  const safe = sanitizeHomeRawHtml(html);
  const padding = PADDING_CLASS[config.padding ?? 'comfortable'];

  return (
    <section className={padding}>
      {title ? (
        <h2 className="mb-3 text-lg font-bold text-ink-900 md:text-xl">{title}</h2>
      ) : null}
      <div className="home-raw-html" dangerouslySetInnerHTML={{ __html: safe }} />
    </section>
  );
}
