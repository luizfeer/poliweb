import { Fragment } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, ChevronLeft, Clock, Info, MapPin, ShieldCheck } from 'lucide-react';
import { AppFrame, Band, TabBar } from '@/components/carmo';
import { CONVENIENCE_FEE, formatBRL, formatDuration, getScheduleById } from '@/lib/passagens/mock';

export const metadata = {
  title: 'Escolha sua poltrona — Portal Carmelitano',
};

const TAKEN = new Set([3, 4, 11, 14, 19, 22, 27, 31, 34, 38]);
const PREMIUM = new Set([1, 2, 5, 6]);
const SUGGESTED = 9;

export default async function ScheduleDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const schedule = getScheduleById(id);
  if (!schedule) notFound();

  const seats = Array.from({ length: 44 }, (_, i) => i + 1);
  const total = schedule.price + CONVENIENCE_FEE;

  return (
    <AppFrame>
      {/* Header */}
      <div className="bg-clay-500 px-3.5 pt-3 pb-4 text-white md:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link
            href="/passagens/buscar"
            aria-label="Voltar"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 hover:bg-white/30"
          >
            <ChevronLeft size={18} strokeWidth={2.6} />
          </Link>
          <span className="rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold">
            {schedule.operator.name}
          </span>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <div className="flex flex-col items-center">
            <span className="font-display text-[24px] font-extrabold leading-none">
              {schedule.departure}
            </span>
            <span className="mt-1 text-[10px] font-bold uppercase tracking-wide text-white/80">
              Carmo
            </span>
          </div>
          <div className="flex flex-1 flex-col items-center text-white/80">
            <span className="text-[10px] font-bold uppercase tracking-wide">
              {formatDuration(schedule.durationMin)}
            </span>
            <div className="my-1 h-px w-full bg-white/30" />
            <span className="text-[10px] font-bold uppercase tracking-wide">{schedule.vehicleClass}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-display text-[24px] font-extrabold leading-none">
              {schedule.arrival}
            </span>
            <span className="mt-1 text-[10px] font-bold uppercase tracking-wide text-white/80">
              {schedule.destination.split('/')[0].slice(0, 5)}
            </span>
          </div>
        </div>
      </div>

      {/* Detalhes */}
      <Band className="px-3.5 pt-3">
        <div className="rounded-md border border-ink-100 bg-white p-3">
          <Row icon={MapPin} label="Embarque" value="Rodoviária Carmo do Rio Claro" sub="Av. Brasil, s/n · Centro" />
          <Row icon={MapPin} label="Desembarque" value={`Rodoviária ${schedule.destination.split('/')[0]}`} sub="Plataforma a definir" />
          <Row icon={Clock} label="Duração" value={formatDuration(schedule.durationMin)} sub="sem paradas" last />
        </div>
      </Band>

      {/* Mapa de assentos */}
      <Band className="px-3.5 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="m-0 font-sans text-[16px] font-extrabold text-ink-900">
            Escolha sua poltrona
          </h2>
          <span className="text-[11px] font-medium text-ink-500">
            {schedule.seatsLeft} disponíveis
          </span>
        </div>

        {/* Legenda */}
        <div className="mt-2 flex flex-wrap gap-3 text-[11px]">
          <Legend tone="bg-white border-ink-200" label="Livre" />
          <Legend tone="bg-clay-500" label="Selecionada" textWhite />
          <Legend tone="bg-ink-200" label="Ocupada" />
          <Legend tone="bg-cerrado-100 border-cerrado-300" label="Premium +R$ 5" />
        </div>

        {/* Bus mockup */}
        <div className="mt-3 rounded-md border border-ink-100 bg-paper-deep p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wide text-ink-500">
              Frente
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wide text-ink-500">
              🪟 janela
            </span>
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] gap-x-3 gap-y-1.5">
            {seats.map((n, idx) => {
              const isAisleBreak = idx % 4 === 1; // after 2nd col -> render aisle
              const isTaken = TAKEN.has(n);
              const isPremium = PREMIUM.has(n);
              const isSuggested = n === SUGGESTED;

              const seat = (
                <button
                  type="button"
                  disabled={isTaken}
                  className={[
                    'relative h-9 rounded-md border-[1.5px] font-display text-[12px] font-extrabold transition-colors',
                    isTaken
                      ? 'cursor-not-allowed border-ink-200 bg-ink-200 text-ink-400'
                      : isSuggested
                      ? 'border-clay-500 bg-clay-500 text-white shadow-sm'
                      : isPremium
                      ? 'border-cerrado-300 bg-cerrado-100 text-cerrado-700 hover:border-cerrado-500'
                      : 'border-ink-200 bg-white text-ink-900 hover:border-clay-300',
                  ].join(' ')}
                >
                  {n}
                  {isPremium && !isTaken && (
                    <span className="absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center rounded-full bg-cerrado-700 text-[8px] font-extrabold text-white">
                      +
                    </span>
                  )}
                </button>
              );

              if (isAisleBreak) {
                return (
                  <Fragment key={`s-${n}`}>
                    {seat}
                    <div className="w-3" />
                  </Fragment>
                );
              }
              return <Fragment key={`s-${n}`}>{seat}</Fragment>;
            })}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wide text-ink-500">
              Fundo
            </span>
            <span className="text-[10px] font-medium text-ink-500">
              🚻 banheiro
            </span>
          </div>
        </div>
      </Band>

      {/* Aviso */}
      <Band className="px-3.5 pt-3">
        <div className="flex items-start gap-2 rounded-md bg-sky-100 p-3">
          <Info size={16} className="shrink-0 text-sky-700" strokeWidth={2.4} />
          <p className="m-0 text-[12px] text-ink-800">
            Sugerimos a poltrona <strong>9</strong> — janela, longe do banheiro. Você pode trocar.
          </p>
        </div>
      </Band>

      {/* Resumo de preço */}
      <Band className="px-3.5 pt-3 pb-32">
        <div className="rounded-md border border-ink-100 bg-white p-3">
          <h3 className="m-0 mb-2 font-sans text-[14px] font-extrabold text-ink-900">
            Resumo da compra
          </h3>
          <PriceLine label="1× Passagem (poltrona 9)" value={formatBRL(schedule.price)} />
          <PriceLine label="Taxa de conveniência" value={formatBRL(CONVENIENCE_FEE)} />
          <div className="my-2 h-px bg-ink-100" />
          <div className="flex items-baseline justify-between">
            <span className="font-sans text-[13px] font-bold text-ink-900">Total</span>
            <span className="font-display text-[22px] font-extrabold text-clay-600">
              {formatBRL(total)}
            </span>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-2 px-1 text-[11px] text-ink-600">
          <ShieldCheck size={14} className="text-cerrado-700" strokeWidth={2.4} />
          Cancelamento até 3h antes (taxa 5%)
        </div>
      </Band>

      {/* CTA fixo */}
      <div className="fixed inset-x-0 bottom-[calc(72px+env(safe-area-inset-bottom))] z-20 mx-auto max-w-[450px] border-t border-ink-100 bg-white/95 px-3.5 py-3 backdrop-blur-sm md:bottom-0">
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wide text-ink-500">
              Total
            </div>
            <div className="font-display text-[18px] font-extrabold leading-none text-clay-600">
              {formatBRL(total)}
            </div>
          </div>
          <Link
            href={`/passagens/checkout?id=${schedule.id}&seat=9`}
            className="flex flex-1 items-center justify-center gap-2 rounded-md bg-clay-500 py-3 font-sans text-[14px] font-extrabold text-white transition-colors hover:bg-clay-600"
          >
            Continuar
            <ArrowRight size={16} strokeWidth={2.6} />
          </Link>
        </div>
      </div>

      <TabBar active="home" />
    </AppFrame>
  );
}

function Row({
  icon: Icon,
  label,
  value,
  sub,
  last,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
  sub?: string;
  last?: boolean;
}) {
  return (
    <div className={`flex items-start gap-3 ${last ? '' : 'border-b border-ink-100 pb-2 mb-2'}`}>
      <Icon size={16} className="mt-0.5 shrink-0 text-clay-500" strokeWidth={2.3} />
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-bold uppercase tracking-wide text-ink-500">{label}</div>
        <div className="truncate font-sans text-[13px] font-extrabold text-ink-900">{value}</div>
        {sub && <div className="text-[11px] text-ink-600">{sub}</div>}
      </div>
    </div>
  );
}

function Legend({ tone, label, textWhite }: { tone: string; label: string; textWhite?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-ink-700">
      <span className={`inline-block h-3.5 w-4 rounded-sm border-[1.5px] ${tone} ${textWhite ? 'text-white' : ''}`} />
      {label}
    </span>
  );
}

function PriceLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between py-1 text-[12px]">
      <span className="text-ink-700">{label}</span>
      <span className="font-medium text-ink-900">{value}</span>
    </div>
  );
}
