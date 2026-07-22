import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCurrentCity } from '@/lib/cities';
import { getEventBySlug } from '@/lib/community/queries';
import { ReportForm } from '@/components/public/community/report-button';
import { JsonLdScript } from '@/components/seo/json-ld-script';
import { buildMetadata } from '@/lib/seo/metadata';
import { resolvePublicSiteOrigin } from '@/lib/seo/site-origin';
import { breadcrumbJsonLd, eventJsonLd } from '@/lib/seo/structured-data';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const city = await getCurrentCity();
  if (!city) return { title: 'Evento' };
  const { slug } = await params;
  const event = await getEventBySlug({ city_id: city.id, slug });
  if (!event) return { title: 'Evento não encontrado' };
  const when = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(event.startAt));
  return buildMetadata({
    title: `${event.title} — ${when}`,
    description:
      event.description ??
      `${event.title} em ${event.location ?? 'Carmo do Rio Claro'}. Confira data, horário e ingressos no Portal Carmelitano.`,
    path: `/comunidade/agenda/${slug}`,
    image: event.coverUrl ?? undefined,
    type: 'article',
    publishedTime: event.startAt,
  });
}

export default async function EventDetailPage({ params }: Props) {
  const city = await getCurrentCity();
  if (!city || !city.modules.includes('events')) notFound();
  const { slug } = await params;
  const event = await getEventBySlug({ city_id: city.id, slug });
  if (!event) notFound();

  const site = resolvePublicSiteOrigin();
  const url = `${site}/comunidade/agenda/${slug}`;

  const start = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date(event.startAt));

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <JsonLdScript
        data={eventJsonLd({
          name: event.title,
          url,
          startDate: event.startAt,
          endDate: event.endAt,
          description: event.description,
          location: event.location,
          image: event.coverUrl,
        })}
      />
      <JsonLdScript
        data={breadcrumbJsonLd([
          { name: 'Início', url: site },
          { name: 'Agenda', url: `${site}/comunidade/agenda` },
          { name: event.title, url },
        ])}
      />
      <header className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">{start}</p>
        <h1 className="text-4xl font-bold">{event.title}</h1>
        {event.location ? <p className="text-lg text-muted-foreground">{event.location}</p> : null}
      </header>
      {event.description ? <p className="whitespace-pre-wrap leading-relaxed">{event.description}</p> : null}
      <div className="flex flex-wrap gap-3">
        {event.ticketUrl ? (
          <a href={event.ticketUrl} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
            Ver ingressos
          </a>
        ) : null}
        <a
          href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${toCalendarDate(event.startAt)}/${toCalendarDate(event.endAt ?? event.startAt)}`}
          className="rounded-md border px-4 py-2 text-sm"
        >
          Adicionar ao Google Calendar
        </a>
      </div>
      <ReportForm cityId={city.id} entityType="event" entityId={event.id} />
    </main>
  );
}

function toCalendarDate(value: string): string {
  return new Date(value).toISOString().replace(/[-:]|\.\d{3}/g, '');
}
