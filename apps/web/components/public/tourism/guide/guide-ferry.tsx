import { AlertTriangle, Anchor, ArrowRight, Ship } from 'lucide-react';
import Link from 'next/link';
import type { GuideFare } from '@/lib/tourism/types';

export function GuideFerry({
  title,
  subtitle,
  content,
  fares,
  warning,
  cta,
}: {
  title: string;
  subtitle: string | null;
  content: string[] | null;
  fares: GuideFare[] | null;
  warning: string | null;
  cta: { label: string; href: string } | null;
}) {
  return (
    <div className="px-4 md:px-6 lg:px-8">
      <div className="overflow-hidden rounded-xl border border-ink-100 bg-white">
        <div className="border-b border-ink-100 bg-sky-50 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-sky-100 text-sky-700">
              <Ship className="size-5" strokeWidth={2} aria-hidden="true" />
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
          {content && content.length > 0 ? (
            <div className="mb-4 space-y-2">
              {content.map((text, i) => (
                <p key={i} className="m-0 text-[13px] leading-relaxed text-ink-700">
                  {text}
                </p>
              ))}
            </div>
          ) : null}

          {fares && fares.length > 0 ? (
            <div className="mb-4 overflow-hidden rounded-lg border border-ink-100">
              <table className="m-0 w-full text-[13px]">
                <thead>
                  <tr className="bg-paper-deep text-left">
                    <th className="px-4 py-2.5 font-semibold text-ink-600">Tipo</th>
                    <th className="px-4 py-2.5 text-right font-semibold text-ink-600">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {fares.map((fare) => (
                    <tr key={fare.type} className="border-t border-ink-100">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-ink-900">{fare.type}</div>
                        {fare.note ? (
                          <div className="mt-0.5 text-[12px] text-ink-500">{fare.note}</div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-bold text-ink-900">{fare.price}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {warning ? (
            <div className="flex gap-2.5 rounded-lg bg-sun-100 p-3 text-[12px] leading-relaxed text-ink-700">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-sun-500" strokeWidth={2.2} aria-hidden="true" />
              <span>{warning}</span>
            </div>
          ) : null}
        </div>

        {cta ? (
          <div className="border-t border-ink-100 px-5 py-3">
            <Link
              href={cta.href}
              className="inline-flex items-center gap-2 text-[13px] font-bold text-sky-700 no-underline hover:underline"
            >
              <Anchor className="size-4" aria-hidden="true" />
              {cta.label}
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
