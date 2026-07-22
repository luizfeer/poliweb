import Link from 'next/link';
import { ArrowRight, BookOpen, Camera, Compass, MapPinned, Mountain, Sailboat } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Attraction, TourPackage, TourismGuide } from '@/lib/tourism';

type TourismGatewayWidgetProps = {
  cityName: string;
  attractions: Attraction[];
  packages: TourPackage[];
  guides?: TourismGuide[];
  context?: 'home' | 'community';
};

const kindLabels: Record<string, string> = {
  balneario: 'Balneário',
  cachoeira: 'Cachoeira',
  historico: 'Histórico',
  igreja: 'Igreja',
  lago: 'Lago',
  mirante: 'Mirante',
  museu: 'Museu',
  parque: 'Parque',
  praia: 'Praia',
  trilha: 'Trilha',
};

export function TourismGatewayWidget({
  cityName,
  attractions,
  packages,
  guides = [],
  context = 'home',
}: TourismGatewayWidgetProps) {
  const featuredAttractions = attractions.slice(0, 3);
  const featuredPackage = packages[0] ?? null;
  const featuredGuide = guides[0] ?? null;
  const subtitle =
    context === 'community'
      ? 'Atrações e roteiros publicados pela cidade.'
      : 'Planeje passeios, avalie lugares e siga roteiros reais.';

  return (
    <section className="px-3.5 md:px-6 lg:px-8">
      <div className="border-cerrado-100 shadow-card overflow-hidden rounded-lg border bg-white">
        <Link
          href="/turismo"
          className="bg-cerrado-700 hover:bg-cerrado-700/95 flex items-center gap-3 p-4 text-white no-underline"
        >
          <div className="bg-white/14 grid h-11 w-11 shrink-0 place-items-center rounded-full">
            <Sailboat className="text-sun-200 h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sun-200 m-0 text-[11px] font-bold uppercase tracking-wide">
              Turismo em {cityName}
            </p>
            <h2 className="m-0 mt-0.5 text-[18px] font-extrabold leading-tight">{subtitle}</h2>
          </div>
          <ArrowRight className="text-sun-200 h-5 w-5 shrink-0" aria-hidden="true" />
        </Link>

        {featuredAttractions.length > 0 ? (
          <div className="divide-ink-100 grid gap-0 divide-y">
            {featuredAttractions.map((attraction) => (
              <Link
                key={attraction.id}
                href={`/turismo/o-que-fazer/${attraction.slug}`}
                className="hover:bg-paper flex items-center gap-3 p-3 no-underline"
              >
                <div className="bg-cerrado-100 text-cerrado-700 grid h-10 w-10 shrink-0 place-items-center rounded-md">
                  {attraction.type === 'lago' ? (
                    <Sailboat className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Mountain className="h-5 w-5" aria-hidden="true" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <strong className="text-ink-900 block truncate text-[14px]">
                    {attraction.name}
                  </strong>
                  <span className="text-ink-600 text-[12px] font-semibold">
                    {kindLabels[attraction.type] ?? 'Atração'}
                    {attraction.bestSeason ? ` · ${attraction.bestSeason}` : ''}
                  </span>
                </div>
                <MapPinned className="text-clay-600 h-4 w-4" aria-hidden="true" />
              </Link>
            ))}
          </div>
        ) : null}

        {featuredPackage ? (
          <Link
            href={`/turismo/roteiros/${featuredPackage.slug}`}
            className="border-ink-100 hover:bg-paper block border-t p-3 no-underline"
          >
            <p className="text-clay-600 m-0 text-[11px] font-bold uppercase tracking-wide">
              Roteiro em destaque
            </p>
            <strong className="text-ink-900 mt-1 block text-[14px]">
              {featuredPackage.title}
            </strong>
          </Link>
        ) : null}

        {featuredGuide ? (
          <Link
            href={`/turismo/guias/${featuredGuide.slug}`}
            className="border-ink-100 hover:bg-paper block border-t p-3 no-underline"
          >
            <p className="text-cerrado-700 m-0 text-[11px] font-bold uppercase tracking-wide">
              Guia em destaque
            </p>
            <strong className="text-ink-900 mt-1 block text-[14px]">
              {featuredGuide.name}
            </strong>
          </Link>
        ) : null}

        <div className="bg-paper grid grid-cols-3 gap-2 p-3">
          <WidgetLink href="/turismo" icon={Compass} label="Turismo" />
          <WidgetLink href="/turismo/guias" icon={BookOpen} label="Guias" />
          <WidgetLink href="/turismo/experiencias" icon={Camera} label="Fotos" />
        </div>
      </div>
    </section>
  );
}

function WidgetLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="text-ink-900 inline-flex items-center justify-center gap-2 rounded-md bg-white px-3 py-2 text-[12px] font-bold no-underline"
    >
      <Icon className="text-clay-600 h-4 w-4" aria-hidden="true" />
      {label}
    </Link>
  );
}
