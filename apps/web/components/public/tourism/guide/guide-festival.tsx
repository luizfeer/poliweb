import { CalendarDays, CheckCircle2, Lightbulb, PartyPopper } from 'lucide-react';

export function GuideFestival({
  title,
  subtitle,
  date,
  description,
  programHighlights,
  tips,
}: {
  title: string;
  subtitle: string | null;
  date: { month: string; mainDay: string; period: string } | null;
  description: string | null;
  programHighlights: string[] | null;
  tips: string[] | null;
}) {
  return (
    <div className="px-4 md:px-6 lg:px-8">
      <div className="overflow-hidden rounded-xl border border-ink-100 bg-white">
        <div className="border-b border-ink-100 bg-clay-50 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-clay-100 text-clay-600">
              <PartyPopper className="size-5" strokeWidth={2} aria-hidden="true" />
            </div>
            <div>
              <h2 className="m-0 text-[18px] font-extrabold text-ink-900">{title}</h2>
              {subtitle ? (
                <p className="m-0 mt-0.5 text-[13px] text-ink-600">{subtitle}</p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="p-5">
          {date ? (
            <div className="mb-4 flex items-center gap-3 rounded-lg bg-paper-deep p-3">
              <div className="flex size-14 flex-col items-center justify-center rounded-lg bg-clay-500 text-white">
                <CalendarDays className="mb-0.5 size-4" aria-hidden="true" />
                <span className="text-[11px] font-bold uppercase leading-none">{date.month}</span>
              </div>
              <div>
                <p className="m-0 text-[15px] font-bold text-ink-900">{date.mainDay}</p>
                <p className="m-0 mt-0.5 text-[12px] leading-relaxed text-ink-600">{date.period}</p>
              </div>
            </div>
          ) : null}

          {description ? (
            <p className="m-0 mb-4 text-[13px] leading-relaxed text-ink-700">{description}</p>
          ) : null}

          {programHighlights && programHighlights.length > 0 ? (
            <div className="mb-4">
              <h3 className="m-0 mb-2 text-[13px] font-bold uppercase tracking-wide text-ink-500">
                Programação
              </h3>
              <ul className="m-0 list-none space-y-1.5 p-0">
                {programHighlights.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-[13px] text-ink-700">
                    <CheckCircle2
                      className="mt-0.5 size-4 shrink-0 text-cerrado-500"
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {tips && tips.length > 0 ? (
            <div className="rounded-lg bg-cerrado-50 p-4">
              <div className="mb-2 flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wide text-cerrado-700">
                <Lightbulb className="size-3.5" aria-hidden="true" />
                Dicas
              </div>
              <ul className="m-0 list-none space-y-1.5 p-0">
                {tips.map((tip) => (
                  <li key={tip} className="text-[12px] leading-relaxed text-cerrado-700">
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
