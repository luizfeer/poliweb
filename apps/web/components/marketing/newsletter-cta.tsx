import { Mail } from 'lucide-react';
import { subscribeNewsletterAction } from '@/app/newsletter/actions';

export function NewsletterCTA({
  citySlug = 'carmo-do-rio-claro',
  source = 'site',
}: {
  citySlug?: string;
  source?: string;
}) {
  return (
    <form action={subscribeNewsletterAction} className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-[1fr_auto]">
      <input type="hidden" name="city_slug" value={citySlug} />
      <input type="hidden" name="source" value={source} />
      <label className="sr-only" htmlFor={`newsletter-email-${source}`}>Email</label>
      <input
        id={`newsletter-email-${source}`}
        name="email"
        type="email"
        required
        placeholder="seu@email.com"
        className="rounded-md border bg-background px-3 py-2"
      />
      <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
        <Mail className="h-4 w-4" aria-hidden="true" />
        Receber resumo
      </button>
    </form>
  );
}
