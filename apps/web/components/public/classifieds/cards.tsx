import Link from 'next/link';
import {
  BadgeCheck,
  BriefcaseBusiness,
  Car,
  Flag,
  HandHeart,
  MapPin,
  Package,
  Play,
  Tag,
  Wrench,
} from 'lucide-react';
import { ClassifiedContactGate } from '@/components/public/contact/classified-contact-gate';
import { StoryPhotoGallery, type StoryGalleryPhoto } from '@/components/public/media/story-photo-gallery';
import { isVideoSrc, videoPosterUrl } from '@/lib/media/video-poster';
import type { Json } from '@/lib/supabase/database.types';
import type { Classified, ClassifiedCounts, ClassifiedType } from '@/lib/classifieds/types';

const moneyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const typeMeta: Record<
  ClassifiedType,
  { label: string; href: string; icon: typeof Car; cta: string }
> = {
  vehicle: {
    label: 'Veículos',
    href: '/classificados/veiculos',
    icon: Car,
    cta: 'Carros, motos e utilitários',
  },
  job: {
    label: 'Vagas',
    href: '/classificados/vagas',
    icon: BriefcaseBusiness,
    cta: 'Oportunidades gratuitas',
  },
  service: {
    label: 'Serviços',
    href: '/classificados/servicos',
    icon: Wrench,
    cta: 'Autônomos e prestadores',
  },
  item: {
    label: 'Itens',
    href: '/classificados/itens',
    icon: Package,
    cta: 'Móveis, eletros e usados',
  },
  other: { label: 'Outros', href: '/classificados/buscar', icon: Flag, cta: 'Anúncios diversos' },
};

export function ClassifiedHubCards({ counts }: { counts: ClassifiedCounts }) {
  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {(['vehicle', 'job', 'service', 'item'] as ClassifiedType[]).map((type) => {
        const meta = typeMeta[type];
        const Icon = meta.icon;
        return (
          <Link
            key={type}
            href={meta.href}
            className="border-ink-100 shadow-card hover:border-clay-200 group relative overflow-hidden rounded-2xl border bg-white p-4 hover:no-underline"
          >
            <Icon
              className="text-clay-700/10 pointer-events-none absolute -bottom-5 -right-5 h-20 w-20"
              aria-hidden="true"
            />
            <div className="bg-clay-50 text-clay-700 flex h-11 w-11 items-center justify-center rounded-xl">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 className="font-display text-ink-900 m-0 mt-4 text-[19px] font-extrabold">
              {meta.label}
            </h2>
            <p className="text-ink-700 m-0 mt-1 text-[13px] leading-relaxed">{meta.cta}</p>
            <p className="text-clay-700 m-0 mt-4 text-[12px] font-extrabold">
              {counts[type]} anúncios ativos
            </p>
          </Link>
        );
      })}
    </section>
  );
}

export function ClassifiedCard({ classified }: { classified: Classified }) {
  const href = `${hrefForType(classified.type)}/${classified.slug}`;
  const isFeatured = isCurrentlyFeatured(classified.featuredUntil);
  return (
    <Link
      href={href}
      className={`shadow-card group relative block overflow-hidden rounded-2xl border bg-white p-4 hover:no-underline ${
        isFeatured ? 'border-sun-300 ring-sun-200 ring-1' : 'border-ink-100 hover:border-clay-200'
      }`}
    >
      <Tag
        className="text-clay-700/10 pointer-events-none absolute -bottom-5 -right-5 h-20 w-20"
        aria-hidden="true"
      />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-clay-700 m-0 text-[12px] font-bold uppercase">
            {classified.categoryLabel ?? typeMeta[classified.type].label}
          </p>
          <h2 className="font-display text-ink-900 m-0 mt-1 text-[18px] font-extrabold leading-tight">
            {classified.title}
          </h2>
        </div>
        <div className="flex flex-col items-end gap-1">
          {isFeatured ? <FeaturedBadge /> : null}
          {classified.type === 'job' ? <FreeBadge /> : null}
        </div>
      </div>
      <p className="text-cerrado-700 relative m-0 mt-3 text-[16px] font-extrabold">
        {priceLabel(classified)}
      </p>
      <p className="text-ink-600 relative m-0 mt-2 text-[13px]">{summary(classified)}</p>
      {classified.description ? (
        <p className="text-ink-700 relative m-0 mt-3 line-clamp-2 text-[13px] leading-relaxed">
          {classified.description}
        </p>
      ) : null}
    </Link>
  );
}

export function ClassifiedHeader({ classified }: { classified: Classified }) {
  const media = mediaForClassified(classified);
  const cover = media[0] ?? null;
  return (
    <header className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-3">
        <div className="bg-muted flex aspect-[16/9] items-center justify-center overflow-hidden rounded-2xl border">
          {cover ? (
            isVideoSrc(cover.src, cover.contentType) ? (
              <div className="relative h-full w-full">
                <video
                  src={cover.src}
                  poster={videoPosterUrl(cover.src) ?? undefined}
                  className="h-full w-full object-cover"
                  muted
                  playsInline
                  preload="metadata"
                />
                <span className="absolute inset-0 flex items-center justify-center bg-black/20 text-white">
                  <Play className="h-12 w-12 fill-white" aria-hidden="true" />
                </span>
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover.src} alt="" className="h-full w-full object-cover" />
            )
          ) : (
            <span className="text-muted-foreground text-sm">Sem foto</span>
          )}
        </div>
        {media.length > 1 ? (
          <StoryPhotoGallery title={classified.title} photos={media} />
        ) : null}
      </div>
      <div className="space-y-4">
        <div>
          <p className="text-muted-foreground text-sm">{typeMeta[classified.type].label}</p>
          <h1 className="text-3xl font-bold">{classified.title}</h1>
        </div>
        <p className="text-2xl font-semibold">{priceLabel(classified)}</p>
        <div className="flex flex-wrap gap-2">
          {classified.type === 'job' ? <FreeBadge /> : null}
          {classified.item?.isFreeItem ? (
            <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium">
              <HandHeart className="h-3.5 w-3.5" aria-hidden="true" />
              Doação/oferta
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium">
            <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Aprovado
          </span>
        </div>
        {classified.description ? (
          <p className="text-muted-foreground">{classified.description}</p>
        ) : null}
        <ContactBox classified={classified} />
      </div>
    </header>
  );
}

export function ClassifiedDetails({ classified }: { classified: Classified }) {
  const rows = detailRows(classified);
  return (
    <section className="bg-card rounded-lg border p-5">
      <h2 className="text-xl font-semibold">Detalhes</h2>
      <dl className="mt-4 grid gap-3 md:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="bg-background rounded-md border p-3">
            <dt className="text-muted-foreground text-xs font-medium uppercase">{label}</dt>
            <dd className="mt-1 font-medium">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function PaywallNotice({ amountCents, days }: { amountCents: number; days: number }) {
  if (amountCents === 0) {
    return (
      <p className="bg-card rounded-lg border p-4 text-sm">
        Publicar esta categoria é grátis, mas ainda passa por aprovação.
      </p>
    );
  }
  return (
    <p className="bg-card rounded-lg border p-4 text-sm">
      Anunciar custa {moneyFormatter.format(amountCents / 100)} e vale {days} dias. A taxa ajuda a
      reduzir golpes.
    </p>
  );
}

export function FreeBadge() {
  return (
    <span className="bg-sun-100 text-ink-900 rounded-full px-2 py-1 text-xs font-extrabold">
      GRÁTIS
    </span>
  );
}

export function FeaturedBadge() {
  return (
    <span className="bg-sun-300 text-ink-900 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-extrabold uppercase">
      <BadgeCheck className="h-3 w-3" aria-hidden="true" />
      Destaque
    </span>
  );
}

export function isCurrentlyFeatured(featuredUntil: string | null | undefined): boolean {
  if (!featuredUntil) return false;
  return new Date(featuredUntil).getTime() > Date.now();
}

function ContactBox({ classified }: { classified: Classified }) {
  return (
    <ClassifiedContactGate
      classifiedId={classified.id}
      classifiedSlug={classified.slug}
      nextPath={`${hrefForType(classified.type)}/${classified.slug}`}
      contactName={classified.contactName}
    />
  );
}

function priceLabel(classified: Classified): string {
  if (classified.type === 'job') return classified.job?.faixaSalarial ?? 'Salário a combinar';
  if (classified.item?.isFreeItem) return 'Grátis';
  if (classified.price === null) return 'Combinar';
  return moneyFormatter.format(classified.price);
}

function summary(classified: Classified): string {
  if (classified.vehicle) {
    return [
      classified.vehicle.marca,
      classified.vehicle.modelo,
      classified.vehicle.anoModelo,
      classified.vehicle.km ? `${classified.vehicle.km} km` : null,
    ]
      .filter(Boolean)
      .join(' - ');
  }
  if (classified.job) {
    return [
      classified.job.tipo?.toUpperCase(),
      classified.job.modalidade,
      classified.job.faixaSalarial,
    ]
      .filter(Boolean)
      .join(' - ');
  }
  if (classified.service) {
    return [
      classified.service.areaAtuacao,
      classified.service.atendeEmCasa ? 'Atende em casa' : null,
    ]
      .filter(Boolean)
      .join(' - ');
  }
  if (classified.item) {
    return [
      classified.item.condicao,
      classified.item.marca,
      classified.item.aceitaTroca ? 'Aceita troca' : null,
    ]
      .filter(Boolean)
      .join(' - ');
  }
  return classified.categoryLabel ?? 'Classificado local';
}

function detailRows(classified: Classified): Array<[string, string]> {
  if (classified.vehicle) {
    return [
      ['Marca', classified.vehicle.marca ?? '-'],
      ['Modelo', classified.vehicle.modelo ?? '-'],
      ['Ano modelo', String(classified.vehicle.anoModelo ?? '-')],
      ['Quilometragem', classified.vehicle.km ? `${classified.vehicle.km} km` : '-'],
      ['Combustível', classified.vehicle.combustivel ?? '-'],
      ['Câmbio', classified.vehicle.cambio ?? '-'],
      ['Cor', classified.vehicle.cor ?? '-'],
      ['Final da placa', classified.vehicle.placaFinal ?? '-'],
    ];
  }
  if (classified.job) {
    return [
      ['Contrato', classified.job.tipo?.toUpperCase() ?? '-'],
      ['Modalidade', classified.job.modalidade ?? '-'],
      ['Salário', classified.job.faixaSalarial ?? 'A combinar'],
      ['Requisitos', classified.job.requisitos ?? '-'],
    ];
  }
  if (classified.service) {
    return [
      ['Área', classified.service.areaAtuacao ?? '-'],
      ['Atende em casa', classified.service.atendeEmCasa ? 'Sim' : 'Nao'],
      [
        'Raio',
        classified.service.raioAtendimentoKm ? `${classified.service.raioAtendimentoKm} km` : '-',
      ],
      ['Faixa de preço', classified.service.faixaPreco ?? '-'],
    ];
  }
  if (classified.item) {
    return [
      ['Condição', classified.item.condicao ?? '-'],
      ['Marca', classified.item.marca ?? '-'],
      ['Aceita troca', classified.item.aceitaTroca ? 'Sim' : 'Não'],
      ['Motivo da venda', classified.item.motivoVenda ?? '-'],
    ];
  }
  return [['Categoria', classified.categoryLabel ?? 'Outros']];
}

function hrefForType(type: ClassifiedType): string {
  if (type === 'vehicle') return '/classificados/veiculos';
  if (type === 'job') return '/classificados/vagas';
  if (type === 'service') return '/classificados/servicos';
  if (type === 'item') return '/classificados/itens';
  return '/classificados/buscar';
}

function mediaForClassified(classified: Classified): StoryGalleryPhoto[] {
  const urls = [classified.coverUrl, ...asStringArray(classified.photos)].filter(
    (url): url is string => Boolean(url),
  );
  return Array.from(new Set(urls)).map((src) => ({ src }));
}

function asStringArray(value: Json | null): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object' && 'url' in item && typeof item.url === 'string') {
        return item.url;
      }
      return null;
    })
    .filter((item): item is string => Boolean(item));
}

export function LocationHint() {
  return (
    <p className="text-muted-foreground inline-flex items-center gap-1 text-sm">
      <MapPin className="h-4 w-4" aria-hidden="true" />
      Anúncios da cidade atual
    </p>
  );
}
