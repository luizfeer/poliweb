import { ExternalLink, MapPin } from 'lucide-react';
import type { Attraction, GuideLinkedEntity } from '@/lib/tourism/types';
import { Link } from '@/components/navigation/link';

function resolveTourismImage(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return url;
  const path = url.startsWith('/') ? url.slice(1) : url;
  return `${base}/storage/v1/object/public/tourism/${path}`;
}

const TYPE_LABEL: Record<string, string> = {
  balneario: 'Balneário',
  mirante: 'Mirante',
  cachoeira: 'Cachoeira',
  trilha: 'Trilha',
  igreja: 'Igreja',
  museu: 'Museu',
  parque: 'Parque',
  praia: 'Praia',
  lago: 'Lago',
  historico: 'Histórico',
};

type Row = { link: GuideLinkedEntity; attraction: Attraction };

function truncate(s: string | null, max: number): string | null {
  if (!s) return null;
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

export function GuidePrincipalAttractions({ rows }: { rows: Row[] }) {
  if (rows.length === 0) return null;

  return (
    <div className="px-4 md:px-6 lg:px-8">
      <h2 className="m-0 font-display text-[22px] font-extrabold tracking-tight text-ink-900 md:text-[26px]">
        Principais atrações
      </h2>
      <p className="text-muted-foreground m-0 mt-1 text-[14px]">
        Pontos cadastrados no município e ligados a este guia.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map(({ link, attraction }) => {
          const title = (link.label?.trim() || attraction.name).trim();
          const desc =
            truncate(link.description, 180) ?? truncate(attraction.description, 180) ?? null;
          const typeLabel = TYPE_LABEL[attraction.type] ?? attraction.type;
          const cover = resolveTourismImage(attraction.coverUrl);
          return (
            <Link
              key={link.id}
              href={`/turismo/o-que-fazer/${attraction.slug}`}
              className="group flex h-full flex-col overflow-hidden rounded-xl border border-ink-100 bg-white no-underline shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-ink-100">
                {cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cover}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="bg-muted flex h-full w-full items-center justify-center text-xs text-ink-400">
                    Sem foto
                  </div>
                )}
              </div>
              <div className="flex min-h-0 flex-1 flex-col p-4">
                <span className="text-clay-600 text-[11px] font-bold uppercase tracking-wide">
                  {typeLabel}
                </span>
                <h3 className="m-0 mt-1 text-[16px] font-bold leading-snug text-ink-900 group-hover:text-clay-700">
                  {title}
                </h3>
                {desc ? <p className="m-0 mt-2 line-clamp-3 text-[13px] leading-relaxed text-ink-600">{desc}</p> : null}
                {attraction.address ? (
                  <p className="m-0 mt-2 flex items-start gap-1 text-[11px] text-ink-500">
                    <MapPin className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
                    {attraction.address}
                  </p>
                ) : null}
                <span className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-sky-700">
                  Ver atração
                  <ExternalLink className="size-3" aria-hidden="true" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
