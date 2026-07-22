import { ArrowUpRight, Clock3, Play, Sparkles, Tag } from 'lucide-react';
import type { GuideExperience } from '@/lib/tourism/types';
import { videoPosterUrl } from '@/lib/media/video-poster';

export function GuideExperiences({
  title,
  subtitle,
  experiences,
}: {
  title: string;
  subtitle: string | null;
  experiences: GuideExperience[];
}) {
  if (experiences.length === 0) return null;

  return (
    <div className="px-4 md:px-6 lg:px-8">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="size-5 text-clay-500" strokeWidth={2} aria-hidden="true" />
        <div>
          <h2 className="m-0 font-display text-[22px] font-extrabold tracking-tight text-ink-900 md:text-[26px]">
            {title}
          </h2>
          {subtitle ? (
            <p className="m-0 mt-1 text-[14px] leading-relaxed text-ink-600">{subtitle}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {experiences.map((exp, index) => {
          const isVideo = exp.mediaKind === 'video';
          return (
            <article
              key={exp.title}
              className="group flex flex-col overflow-hidden rounded-xl border border-ink-100 bg-white transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-paper-deep">
                {exp.image ? (
                  isVideo ? (
                    <video
                      src={exp.image}
                      poster={videoPosterUrl(exp.image) ?? undefined}
                      className="h-full w-full object-cover"
                      controls
                      preload="metadata"
                      playsInline
                      aria-label={exp.alt ?? exp.title}
                    >
                      <track kind="captions" />
                    </video>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={exp.image}
                      alt={exp.alt ?? exp.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      loading={index < 3 ? 'eager' : 'lazy'}
                    />
                  )
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-ink-400">
                    <Sparkles className="size-10" strokeWidth={1.2} aria-hidden="true" />
                  </div>
                )}
                {isVideo ? (
                  <span className="pointer-events-none absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white">
                    <Play className="size-3" aria-hidden="true" />
                    Vídeo
                  </span>
                ) : null}
              </div>

              <div className="flex flex-1 flex-col p-4">
                <h3 className="m-0 text-[15px] font-bold leading-snug text-ink-900">
                  {exp.title}
                </h3>
                <p className="m-0 mt-1.5 line-clamp-3 text-[13px] leading-relaxed text-ink-600">
                  {exp.description}
                </p>

                {(exp.duration || exp.price) && (
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-ink-700">
                    {exp.duration ? (
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="size-3.5" aria-hidden="true" />
                        {exp.duration}
                      </span>
                    ) : null}
                    {exp.price ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-ink-900">
                        <Tag className="size-3.5" aria-hidden="true" />
                        {exp.price}
                      </span>
                    ) : null}
                  </div>
                )}

                {exp.tags.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {exp.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-cerrado-50 px-2.5 py-1 text-[11px] font-semibold text-cerrado-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}

                {exp.cta ? (
                  <a
                    href={exp.cta.href}
                    className="mt-4 inline-flex min-h-10 items-center justify-center gap-1.5 rounded-md bg-ink-900 px-3 text-[13px] font-bold text-white no-underline transition-colors hover:bg-ink-800"
                    target={exp.cta.href.startsWith('http') ? '_blank' : undefined}
                    rel={exp.cta.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  >
                    {exp.cta.label}
                    <ArrowUpRight className="size-4" aria-hidden="true" />
                  </a>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
