import Link from 'next/link';
import { AtSign, CheckCircle2, Church, Clock, MapPin, ShieldCheck } from 'lucide-react';
import { formatInstagramHandle, getInstagramUrl } from '@/lib/churches/instagram';
import type { Church as ChurchType, ChurchScheduleItem } from '@/lib/churches/types';

const traditionLabel = {
  catolica: 'Católica',
  evangelica: 'Evangélica',
  adventista: 'Adventista',
  outra: 'Outra',
} satisfies Record<ChurchType['tradition'], string>;

export function ChurchCard({
  church,
  schedule,
}: {
  church: ChurchType;
  schedule: ChurchScheduleItem[];
}) {
  const nextItems = schedule.slice(0, 3);

  return (
    <article className="group overflow-hidden rounded-lg border border-ink-100 bg-white shadow-card transition-all hover:-translate-y-0.5 hover:shadow-pop">
      <div className="border-b border-ink-100 bg-paper-card p-4">
        <Link
          href={`/comunidade/igrejas/${church.slug}`}
          className="flex items-start justify-between gap-3 text-ink-900 hover:no-underline"
        >
          <div className="flex min-w-0 gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-clay-50 text-clay-600">
              <Church size={22} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-normal text-cerrado-700">
                {traditionLabel[church.tradition]}
              </p>
              <h2 className="mt-1 line-clamp-2 text-[17px] font-bold leading-snug text-ink-900">{church.name}</h2>
            </div>
          </div>
          {church.claimed ? (
            <CheckCircle2 className="mt-1 shrink-0 text-cerrado-500" size={18} aria-label="Perfil reivindicado" />
          ) : (
            <ShieldCheck className="mt-1 shrink-0 text-sky-700" size={18} aria-label="Perfil aberto para reivindicação" />
          )}
        </Link>

        <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-ink-600">{church.shortDescription}</p>
      </div>

      <div className="space-y-2 p-4">
        {nextItems.length > 0 ? (
          nextItems.map((item) => (
            <div key={item.id} className="flex items-center gap-2 rounded-md bg-paper px-2.5 py-2 text-[13px] text-ink-800">
              <Clock size={15} className="shrink-0 text-clay-600" aria-hidden="true" />
              <span className="font-semibold">{item.time}</span>
              <span className="min-w-0 truncate">{item.title}</span>
            </div>
          ))
        ) : (
          <div className="rounded-md bg-paper px-2.5 py-2 text-[13px] text-ink-600">
            Programação aguardando confirmação.
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1 text-[12px] text-ink-600">
          {church.neighborhood ? (
            <span className="inline-flex items-center gap-1">
              <MapPin size={13} aria-hidden="true" />
              {church.neighborhood}
            </span>
          ) : null}
          {church.instagram ? (
            <a
              href={getInstagramUrl(church.instagram)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-ink-600 hover:text-clay-700 hover:no-underline"
            >
              <AtSign size={13} aria-hidden="true" />
              {formatInstagramHandle(church.instagram)}
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function ClaimChurchCallout({ churchName }: { churchName: string }) {
  return (
    <section className="rounded-lg border border-sky-100 bg-sky-100/70 p-4 shadow-card">
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-700 text-white">
          <ShieldCheck size={19} aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-[17px] font-bold text-ink-900">Administrar página da igreja</h2>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-700">
            Responsáveis por {churchName} poderão reivindicar o perfil para atualizar horários de cultos, missas,
            contatos, endereço e avisos semanais.
          </p>
          <Link
            href="/entrar"
            className="mt-3 inline-flex items-center gap-2 rounded-md bg-sky-700 px-3 py-2 text-[13px] font-bold text-white hover:no-underline"
          >
            Entrar para reivindicar
          </Link>
        </div>
      </div>
    </section>
  );
}
