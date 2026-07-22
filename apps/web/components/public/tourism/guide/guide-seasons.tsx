import { Leaf, Snowflake, Sun, Thermometer } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { GuideSeason } from '@/lib/tourism/types';

const SEASON_STYLES: { icon: LucideIcon; accent: string; bg: string }[] = [
  { icon: Snowflake, accent: 'text-sky-700', bg: 'bg-sky-50' },
  { icon: Sun, accent: 'text-sun-500', bg: 'bg-sun-100' },
  { icon: Thermometer, accent: 'text-clay-600', bg: 'bg-clay-50' },
  { icon: Leaf, accent: 'text-cerrado-700', bg: 'bg-cerrado-50' },
];

export function GuideSeasons({
  title,
  subtitle,
  seasons,
}: {
  title: string;
  subtitle: string | null;
  seasons: GuideSeason[];
}) {
  if (seasons.length === 0) return null;

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

      <div className="grid gap-3 md:grid-cols-2">
        {seasons.map((season, index) => {
          const style = SEASON_STYLES[index % SEASON_STYLES.length];
          const Icon = style.icon;
          return (
            <div
              key={season.period}
              className="overflow-hidden rounded-xl border border-ink-100 bg-white"
            >
              <div className={`flex items-center gap-3 px-4 py-3 ${style.bg}`}>
                <Icon className={`size-5 ${style.accent}`} strokeWidth={2} aria-hidden="true" />
                <div>
                  <p className="m-0 text-[14px] font-bold text-ink-900">{season.period}</p>
                  <p className={`m-0 text-[12px] font-semibold ${style.accent}`}>
                    {season.idealFor}
                  </p>
                </div>
              </div>
              <div className="px-4 py-3">
                <p className="m-0 text-[13px] leading-relaxed text-ink-600">{season.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
