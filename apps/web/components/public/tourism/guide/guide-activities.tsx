import { MapPin, Play } from 'lucide-react';
import type { GuideSectionItem } from '@/lib/tourism/types';
import { videoPosterUrl } from '@/lib/media/video-poster';

export function GuideActivities({
  items,
  title,
  subtitle,
}: {
  items: GuideSectionItem[];
  title: string;
  subtitle: string | null;
}) {
  if (items.length === 0) return null;

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
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item, index) => {
          const isVideo = item.mediaKind === 'video';
          return (
            <article
              key={item.title}
              className="group overflow-hidden rounded-xl border border-ink-100 bg-white transition-shadow hover:shadow-md"
            >
              {item.image ? (
                <div className="relative aspect-[16/10] overflow-hidden bg-paper-deep">
                  {isVideo ? (
                    <video
                      src={item.image}
                      poster={videoPosterUrl(item.image) ?? undefined}
                      className="h-full w-full object-cover"
                      controls
                      preload="metadata"
                      playsInline
                      aria-label={item.alt ?? item.title}
                    >
                      <track kind="captions" />
                    </video>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image}
                      alt={item.alt ?? item.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      loading={index < 2 ? 'eager' : 'lazy'}
                    />
                  )}
                  <div className="pointer-events-none absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent px-4 pb-3 pt-8">
                    <span className="text-[12px] font-semibold text-white/90">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>
                  {isVideo ? (
                    <span className="pointer-events-none absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white">
                      <Play className="size-3" aria-hidden="true" />
                      Vídeo
                    </span>
                  ) : null}
                </div>
              ) : (
                <div className="flex aspect-[16/10] items-center justify-center bg-paper-deep text-ink-400">
                  <MapPin className="size-10" strokeWidth={1.2} aria-hidden="true" />
                </div>
              )}
              <div className="p-4">
                <h3 className="m-0 text-[15px] font-bold leading-snug text-ink-900">
                  {item.title}
                </h3>
                <p className="m-0 mt-1.5 text-[13px] leading-relaxed text-ink-600">
                  {item.description}
                </p>
                {item.tags.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-cerrado-50 px-2.5 py-1 text-[11px] font-semibold text-cerrado-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
