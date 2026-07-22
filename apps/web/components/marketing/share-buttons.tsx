import { Copy, Send } from 'lucide-react';

export function ShareButtons({ url, title }: { url: string; title: string }) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  return (
    <nav aria-label="Compartilhar" className="flex flex-wrap gap-2">
      <a className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm" href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`}>
        <Send className="h-4 w-4" aria-hidden="true" />
        WhatsApp
      </a>
      <a className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm" href={`https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`}>
        <Send className="h-4 w-4" aria-hidden="true" />
        Telegram
      </a>
      <a className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm" href={url}>
        <Copy className="h-4 w-4" aria-hidden="true" />
        Link
      </a>
    </nav>
  );
}
