import { AlertCircle, BadgeCheck, MapPin } from 'lucide-react';
import type { GuidePlace } from '@/lib/tourism/types';

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  Religioso: { bg: 'bg-clay-50', text: 'text-clay-600' },
  Natureza: { bg: 'bg-cerrado-50', text: 'text-cerrado-700' },
  Acesso: { bg: 'bg-sky-50', text: 'text-sky-700' },
  'Hospedagem e alimentação': { bg: 'bg-sun-100', text: 'text-sun-500' },
  'Alimentação e lazer': { bg: 'bg-sun-100', text: 'text-sun-500' },
};

export function GuidePlaces({
  title,
  subtitle,
  places,
}: {
  title: string;
  subtitle: string | null;
  places: GuidePlace[];
}) {
  if (places.length === 0) return null;

  const featured = places.filter((p) => p.featured);
  const others = places.filter((p) => !p.featured);

  return (
    <div className="px-4 md:px-6 lg:px-8">
      <div className="mb-4">
        <h2 className="m-0 font-display text-[22px] font-extrabold tracking-tight text-ink-900 md:text-[26px]">
          {title}
        </h2>
        {subtitle ? (
          <p className="m-0 mt-1 text-[14px] leading-relaxed text-ink-600">{subtitle}</p>
        ) : null}
      </div>

      {featured.length > 0 ? (
        <div className="mb-3 grid gap-3 md:grid-cols-3">
          {featured.map((place) => {
            const colors = CATEGORY_COLORS[place.category] ?? { bg: 'bg-paper-deep', text: 'text-ink-600' };
            return (
              <div
                key={place.name}
                className="rounded-xl border border-ink-100 bg-white p-4 transition-shadow hover:shadow-md"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${colors.bg} ${colors.text}`}>
                    {place.category}
                  </span>
                  <BadgeCheck className="size-4 text-cerrado-500" strokeWidth={2.2} aria-hidden="true" />
                </div>
                <h3 className="m-0 text-[15px] font-bold text-ink-900">{place.name}</h3>
                <p className="m-0 mt-1.5 text-[12px] leading-relaxed text-ink-600">
                  {place.description}
                </p>
                {place.address ? (
                  <p className="m-0 mt-2 flex items-start gap-1 text-[11px] text-ink-500">
                    <MapPin className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
                    {place.address}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}

      {others.length > 0 ? (
        <div className="space-y-2">
          {others.map((place) => {
            const colors = CATEGORY_COLORS[place.category] ?? { bg: 'bg-paper-deep', text: 'text-ink-600' };
            return (
              <div
                key={place.name}
                className="flex items-start gap-3 rounded-lg border border-ink-100 bg-white p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="m-0 text-[14px] font-semibold text-ink-900">{place.name}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${colors.bg} ${colors.text}`}>
                      {place.category}
                    </span>
                  </div>
                  <p className="m-0 mt-1 text-[12px] leading-relaxed text-ink-600">
                    {place.description}
                  </p>
                  {place.address ? (
                    <p className="m-0 mt-1 flex items-start gap-1 text-[11px] text-ink-500">
                      <MapPin className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
                      {place.address}
                    </p>
                  ) : null}
                </div>
                {place.needsVerification ? (
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-sun-100 px-2 py-0.5 text-[10px] font-semibold text-sun-500">
                    <AlertCircle className="size-3" aria-hidden="true" />
                    A confirmar
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
