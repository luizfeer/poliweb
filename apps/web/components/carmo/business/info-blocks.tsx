import {
  Accessibility,
  AtSign,
  CreditCard,
  Dog,
  ExternalLink,
  Eye,
  Globe,
  Mail,
  MapPin,
  MessageSquareQuote,
  Package,
  ParkingCircle,
  ShoppingBag,
  Snowflake,
  Star,
  Wifi,
} from 'lucide-react';
import type { Amenity, Business, Hours, PaymentMethod } from '@/lib/businesses/types';
import { formatGoogleImportReviewTime } from '@/lib/format/google-import-review-time';
import { cn } from '@/lib/utils';

const DAYS: Array<{ key: keyof Hours; label: string }> = [
  { key: 'mon', label: 'Segunda' },
  { key: 'tue', label: 'Terça' },
  { key: 'wed', label: 'Quarta' },
  { key: 'thu', label: 'Quinta' },
  { key: 'fri', label: 'Sexta' },
  { key: 'sat', label: 'Sábado' },
  { key: 'sun', label: 'Domingo' },
];

/** Padding lateral alinhado às demais seções da ficha (descrição, contato, avaliações). */
const SECTION_X = 'px-4 md:px-6 lg:px-8';

export function HoursTable({ hours, className }: { hours?: Hours; className?: string }) {
  if (!hours || Object.keys(hours).length === 0) {
    return (
      <p className={cn('text-[13px] text-ink-600 m-0', SECTION_X, className)}>
        Horários não informados.
      </p>
    );
  }
  return (
    <ul className={cn('m-0 p-0 list-none', SECTION_X, className)}>
      {DAYS.map(({ key, label }) => {
        const ranges = hours[key];
        return (
          <li
            key={key}
            className="flex items-baseline justify-between py-1.5 border-b border-ink-100 last:border-0"
          >
            <span className="text-[13px] text-ink-700">{label}</span>
            <span className="text-[13px] font-medium text-ink-900">
              {ranges && ranges.length > 0
                ? ranges.map((r) => `${r.open}–${r.close}`).join(' · ')
                : 'Fechado'}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

const AMENITY_META: Record<Amenity, { icon: typeof Wifi; label: string }> = {
  estacionamento: { icon: ParkingCircle, label: 'Estacionamento' },
  wifi: { icon: Wifi, label: 'Wi-Fi' },
  aceita_pet: { icon: Dog, label: 'Aceita pet' },
  delivery: { icon: Package, label: 'Delivery' },
  retira_no_local: { icon: ShoppingBag, label: 'Retira no local' },
  retirada: { icon: ShoppingBag, label: 'Retirada' },
  consumo_local: { icon: Package, label: 'Consumo no local' },
  area_externa: { icon: MapPin, label: 'Area externa' },
  banheiro: { icon: Accessibility, label: 'Banheiro' },
  pet_friendly: { icon: Dog, label: 'Aceita pet' },
  criancas: { icon: Accessibility, label: 'Bom para criancas' },
  grupos: { icon: Accessibility, label: 'Bom para grupos' },
  reservas: { icon: Package, label: 'Aceita reservas' },
  musica_ao_vivo: { icon: Package, label: 'Musica ao vivo' },
  acessivel: { icon: Accessibility, label: 'Acessível' },
  ar_condicionado: { icon: Snowflake, label: 'Ar-condicionado' },
};

const DELIVERY_CATEGORY_SLUGS = new Set([
  'alimentacao',
  'restaurantes',
  'lanchonete',
  'pizzaria',
  'padaria',
  'acougue',
  'bar',
  'mercado',
  'sorveteria',
  'chocolateria',
  'disk-bebidas',
  'disk-gas',
  'conveniencia',
]);

export function AmenitiesList({
  amenities,
  className,
}: {
  amenities?: Amenity[];
  className?: string;
}) {
  if (!amenities || amenities.length === 0) return null;
  return (
    <ul className={cn('flex flex-wrap gap-1.5 px-3.5 list-none m-0 p-0', className)}>
      {amenities.map((a) => {
        const meta = AMENITY_META[a];
        const Icon = meta.icon;
        return (
          <li
            key={a}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-cerrado-100 text-cerrado-700 text-[12px] font-medium"
          >
            <Icon size={13} strokeWidth={2.2} />
            {meta.label}
          </li>
        );
      })}
    </ul>
  );
}

const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  pix: 'Pix',
  dinheiro: 'Dinheiro',
  credito: 'Crédito',
  debito: 'Débito',
  aproximacao: 'Aproximacao',
  vale_refeicao: 'VR',
  vale_alimentacao: 'VA',
};

export function PaymentMethodsList({
  methods,
  className,
}: {
  methods?: PaymentMethod[];
  className?: string;
}) {
  if (!methods || methods.length === 0) return null;
  return (
    <ul className={cn('flex flex-wrap gap-1.5 px-3.5 list-none m-0 p-0', className)}>
      {methods.map((m) => (
        <li
          key={m}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-paper-deep text-ink-900 text-[12px] font-medium"
        >
          <CreditCard size={13} strokeWidth={2.2} />
          {PAYMENT_LABEL[m]}
        </li>
      ))}
    </ul>
  );
}

export function ContactDetailsBlock({
  business,
  className,
}: {
  business: Business;
  className?: string;
}) {
  const items: Array<{ icon: typeof MapPin; label: string; href?: string }> = [];
  const instagram = normalizeInstagram(business.instagram);
  const website = normalizeWebsite(business.website);

  if (business.address) {
    items.push({
      icon: MapPin,
      label: [business.address, business.district].filter(Boolean).join(' · '),
      href: business.googleMapsUrl,
    });
  }
  if (business.email) {
    items.push({ icon: Mail, label: business.email, href: `mailto:${business.email}` });
  }
  if (website) {
    items.push({ icon: Globe, label: website.label, href: website.href });
  }
  if (instagram) {
    items.push({
      icon: AtSign,
      label: `instagram.com/${instagram}`,
      href: `https://instagram.com/${instagram}`,
    });
  }

  if (items.length === 0) return null;

  return (
    <ul className={cn('space-y-2 m-0 list-none p-0', SECTION_X, className)}>
      {items.map(({ icon: Icon, label, href }, i) => {
        const inner = (
          <span className="flex min-w-0 items-start gap-2.5">
            <Icon size={17} strokeWidth={2.2} className="mt-0.5 shrink-0 text-ink-600" />
            <span className="min-w-0 break-words text-[13px] leading-snug text-ink-900">{label}</span>
          </span>
        );
        return (
          <li key={i}>
            {href ? (
              <a href={href} target="_blank" rel="noopener noreferrer" className="block hover:text-clay-600">
                {inner}
              </a>
            ) : (
              inner
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function visibleBusinessAmenities(business: Business): Amenity[] {
  return (business.amenities ?? []).filter((amenity) => {
    if (amenity !== 'delivery') return true;
    return business.categories.some((slug) => DELIVERY_CATEGORY_SLUGS.has(slug));
  });
}

export function GoogleImportDetailsBlock({ business, className }: { business: Business; className?: string }) {
  const google = business.googleImportSource;
  if (!google) return null;

  const summaries = google.summaries ?? [];
  const reviews = google.approvedReviews ?? [];
  const hasFacts = Boolean(
    google.rating !== undefined ||
      google.streetViewUrl ||
      google.priceRange ||
      google.priceLevel ||
      google.openNow !== undefined,
  );

  if (!hasFacts && summaries.length === 0 && reviews.length === 0) return null;

  return (
    <section className={cn('grid gap-3', SECTION_X, className)}>
      {hasFacts ? (
        <div className="flex flex-wrap gap-2">
          {google.rating !== undefined ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-sun-100 px-2.5 py-1 text-[12px] font-semibold text-ink-900">
              <Star className="size-3.5 fill-sun-500 text-sun-500" aria-hidden="true" />
              Google {google.rating.toFixed(1)}
              {google.userRatingCount ? <span className="font-medium text-ink-600">({google.userRatingCount})</span> : null}
            </span>
          ) : null}
          {google.openNow !== undefined ? (
            <span className="inline-flex items-center rounded-full bg-paper-deep px-2.5 py-1 text-[12px] font-medium text-ink-800">
              {google.openNow ? 'Aberto agora no Google' : 'Fechado agora no Google'}
            </span>
          ) : null}
          {google.priceRange ?? google.priceLevel ? (
            <span className="inline-flex items-center rounded-full bg-paper-deep px-2.5 py-1 text-[12px] font-medium text-ink-800">
              {google.priceRange ?? google.priceLevel}
            </span>
          ) : null}
          {google.streetViewUrl ? (
            <a
              href={google.streetViewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[12px] font-semibold text-sky-700 ring-1 ring-ink-100 hover:bg-paper-tint"
            >
              <Eye className="size-3.5" aria-hidden="true" />
              Ver 360
              <ExternalLink className="size-3" aria-hidden="true" />
            </a>
          ) : null}
        </div>
      ) : null}

      {summaries.length > 0 ? (
        <div className="grid gap-2">
          {summaries.map((summary) => (
            <article key={summary.kind} className="rounded-md border border-ink-100 bg-white p-3">
              <p className="m-0 text-[12px] font-semibold text-ink-500">{summary.label}</p>
              <p className="m-0 mt-1 text-[13px] leading-relaxed text-ink-800">{summary.text}</p>
            </article>
          ))}
        </div>
      ) : null}

      {reviews.length > 0 ? (
        <div className="grid gap-2">
          {reviews.map((review) => {
            const timeLabel = formatGoogleImportReviewTime(review);
            return (
            <article key={review.id} className="rounded-md border border-ink-100 bg-paper p-3">
              <div className="flex flex-wrap items-center gap-2 text-[12px] text-ink-600">
                <MessageSquareQuote className="size-3.5 text-ink-500" aria-hidden="true" />
                <span className="font-semibold text-ink-900">{review.authorName ?? 'Usuario do Google'}</span>
                {review.rating !== undefined ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-ink-800">
                    <Star className="size-3 fill-sun-500 text-sun-500" aria-hidden="true" />
                    {review.rating.toFixed(1)}
                  </span>
                ) : null}
                {timeLabel ? <span>{timeLabel}</span> : null}
              </div>
              {review.text ? <p className="m-0 mt-2 text-[13px] leading-relaxed text-ink-800">{review.text}</p> : null}
              {review.authorUrl ? (
                <a
                  href={review.authorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-sky-700 hover:underline"
                >
                  Ver no Google
                  <ExternalLink className="size-3" aria-hidden="true" />
                </a>
              ) : null}
            </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

function normalizeInstagram(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const withoutDomain = trimmed.replace(/^.*instagram\.com\//i, '');
  const handle = withoutDomain.replace(/^@/, '').split(/[/?#]/)[0]?.trim();
  return handle || null;
}

function normalizeWebsite(value: string | undefined): { label: string; href: string } | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return {
    label: trimmed.replace(/^https?:\/\//i, ''),
    href: /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`,
  };
}

export function ClaimCTA({ businessName, className }: { businessName: string; className?: string }) {
  return (
    <aside
      className={cn(
        'mx-3.5 my-3 bg-sky-100 border border-sky-500/30 rounded-md p-3',
        className,
      )}
    >
      <div className="text-[13px] font-bold text-sky-700">É o dono(a) deste negócio?</div>
      <p className="text-[12px] text-ink-700 leading-snug m-0 mt-1">
        Reivindique a página de <strong>{businessName}</strong> e mantenha seus dados sempre atualizados.
        É grátis.
      </p>
      <a
        href="/painel/comerciante/reivindicar"
        className="inline-block text-[12px] font-semibold text-sky-700 mt-2 hover:underline"
      >
        Reivindicar agora ›
      </a>
    </aside>
  );
}
