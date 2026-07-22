import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Check, ChevronLeft, CreditCard, Lock, QrCode, ShieldCheck, User } from 'lucide-react';
import { AppFrame, Band, TabBar } from '@/components/carmo';
import { CONVENIENCE_FEE, formatBRL, formatDuration, getScheduleById } from '@/lib/passagens/mock';

export const metadata = {
  title: 'Finalizar compra — Portal Carmelitano',
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; seat?: string }>;
}) {
  const { id, seat = '9' } = await searchParams;
  if (!id) notFound();
  const schedule = getScheduleById(id);
  if (!schedule) notFound();

  const total = schedule.price + CONVENIENCE_FEE;

  return (
    <AppFrame>
      {/* Header com progresso */}
      <div className="bg-clay-500 px-3.5 pt-3 pb-4 text-white md:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link
            href={`/passagens/${schedule.id}`}
            aria-label="Voltar"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 hover:bg-white/30"
          >
            <ChevronLeft size={18} strokeWidth={2.6} />
          </Link>
          <div className="flex items-center gap-1.5 text-[11px] font-bold">
            <Lock size={12} strokeWidth={2.6} />
            Pagamento seguro
          </div>
        </div>

        <h1 className="m-0 mt-3 font-display text-[24px] font-extrabold leading-tight">
          Finalizar compra
        </h1>

        {/* Stepper */}
        <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold">
          <Step done label="Horário" />
          <Bar />
          <Step done label="Poltrona" />
          <Bar />
          <Step active label="Pagamento" />
        </div>
      </div>

      {/* Resumo da viagem */}
      <Band className="px-3.5 pt-3">
        <div className="rounded-md border border-cerrado-100 bg-cerrado-50 p-3">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-cerrado-700 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white">
              {schedule.operator.name}
            </span>
            <span className="text-[11px] font-bold text-ink-700">{schedule.vehicleClass}</span>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex flex-col">
              <span className="font-display text-[20px] font-extrabold leading-none text-ink-900">
                {schedule.departure}
              </span>
              <span className="text-[10px] font-medium text-ink-600">Carmo do Rio Claro</span>
            </div>
            <div className="flex-1 text-center text-[10px] font-bold uppercase tracking-wide text-ink-500">
              {formatDuration(schedule.durationMin)} · direto
            </div>
            <div className="flex flex-col text-right">
              <span className="font-display text-[20px] font-extrabold leading-none text-ink-900">
                {schedule.arrival}
              </span>
              <span className="text-[10px] font-medium text-ink-600">{schedule.destination}</span>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-ink-700">
            <span>Hoje, 4 mai · seg</span>
            <span className="font-extrabold">Poltrona {seat}</span>
          </div>
        </div>
      </Band>

      {/* Dados do passageiro */}
      <Band className="px-3.5 pt-4">
        <h2 className="m-0 mb-2 flex items-center gap-2 font-sans text-[15px] font-extrabold text-ink-900">
          <User size={16} className="text-clay-500" strokeWidth={2.4} />
          Dados do passageiro
        </h2>
        <div className="space-y-2 rounded-md border border-ink-100 bg-white p-3">
          <Field label="Nome completo" placeholder="Como está no documento" />
          <div className="grid grid-cols-2 gap-2">
            <Field label="CPF" placeholder="000.000.000-00" />
            <Field label="Nascimento" placeholder="dd/mm/aaaa" />
          </div>
          <Field label="E-mail (recibo)" placeholder="seu@email.com" type="email" />
          <Field label="Celular" placeholder="(35) 9 0000-0000" />
        </div>
        <p className="mt-2 px-1 text-[11px] text-ink-600">
          Mantemos só os 3 últimos dígitos do CPF. O dado completo vai direto pro operador.
        </p>
      </Band>

      {/* Pagamento */}
      <Band className="px-3.5 pt-4">
        <h2 className="m-0 mb-2 flex items-center gap-2 font-sans text-[15px] font-extrabold text-ink-900">
          <CreditCard size={16} className="text-clay-500" strokeWidth={2.4} />
          Forma de pagamento
        </h2>
        <div className="space-y-2">
          <PaymentOption
            icon={QrCode}
            title="PIX"
            sub="Confirma na hora · 5% de desconto"
            tag="Recomendado"
            selected
          />
          <PaymentOption
            icon={CreditCard}
            title="Cartão de crédito"
            sub="Em até 3× sem juros"
          />
        </div>
      </Band>

      {/* Resumo financeiro */}
      <Band className="px-3.5 pt-4 pb-32">
        <div className="rounded-md border border-ink-100 bg-white p-3">
          <PriceLine label="1× Passagem" value={formatBRL(schedule.price)} />
          <PriceLine label="Taxa de conveniência" value={formatBRL(CONVENIENCE_FEE)} />
          <PriceLine label="Desconto PIX (5%)" value={`- ${formatBRL(total * 0.05)}`} positive />
          <div className="my-2 h-px bg-ink-100" />
          <div className="flex items-baseline justify-between">
            <span className="font-sans text-[13px] font-bold text-ink-900">Total no PIX</span>
            <span className="font-display text-[24px] font-extrabold text-clay-600">
              {formatBRL(total * 0.95)}
            </span>
          </div>
        </div>

        <div className="mt-3 flex items-start gap-2 rounded-md bg-paper-deep p-3 text-[11px] text-ink-700">
          <ShieldCheck size={14} className="mt-0.5 shrink-0 text-cerrado-700" strokeWidth={2.4} />
          <span>
            Ao continuar, você aceita os <Link href="/termos" className="text-sky-700 underline">termos</Link> e a
            política de cancelamento (até 3h antes da viagem com taxa de 5% do operador).
          </span>
        </div>
      </Band>

      {/* CTA fixo */}
      <div className="fixed inset-x-0 bottom-[calc(72px+env(safe-area-inset-bottom))] z-20 mx-auto max-w-[450px] border-t border-ink-100 bg-white/95 px-3.5 py-3 backdrop-blur-sm md:bottom-0">
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wide text-ink-500">PIX</div>
            <div className="font-display text-[18px] font-extrabold leading-none text-clay-600">
              {formatBRL(total * 0.95)}
            </div>
          </div>
          <Link
            href="/passagens/confirmacao/CRC8X42K"
            className="flex flex-1 items-center justify-center gap-2 rounded-md bg-clay-500 py-3 font-sans text-[14px] font-extrabold text-white transition-colors hover:bg-clay-600"
          >
            Pagar com PIX
          </Link>
        </div>
      </div>

      <TabBar active="home" />
    </AppFrame>
  );
}

function Field({
  label,
  placeholder,
  type = 'text',
}: {
  label: string;
  placeholder: string;
  type?: string;
}) {
  return (
    <label className="flex flex-col">
      <span className="text-[10px] font-bold uppercase tracking-[0.04em] text-ink-500">
        {label}
      </span>
      <input
        type={type}
        placeholder={placeholder}
        className="mt-1 rounded-md border border-ink-200 bg-white px-3 py-2 font-sans text-[14px] font-medium text-ink-900 outline-none placeholder:text-ink-400 focus:border-clay-500"
      />
    </label>
  );
}

function PaymentOption({
  icon: Icon,
  title,
  sub,
  tag,
  selected,
}: {
  icon: typeof QrCode;
  title: string;
  sub: string;
  tag?: string;
  selected?: boolean;
}) {
  return (
    <button
      type="button"
      className={`flex w-full items-center gap-3 rounded-md border-[1.5px] bg-white p-3 text-left transition-colors ${
        selected ? 'border-clay-500 bg-clay-50' : 'border-ink-200 hover:border-ink-300'
      }`}
    >
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-md ${
          selected ? 'bg-clay-500 text-white' : 'bg-paper-deep text-ink-700'
        }`}
      >
        <Icon size={18} strokeWidth={2.4} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-sans text-[14px] font-extrabold text-ink-900">{title}</span>
          {tag && (
            <span className="rounded-full bg-cerrado-100 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-cerrado-700">
              {tag}
            </span>
          )}
        </div>
        <div className="text-[11px] text-ink-600">{sub}</div>
      </div>
      <div
        className={`flex h-5 w-5 items-center justify-center rounded-full border-[1.5px] ${
          selected ? 'border-clay-500 bg-clay-500 text-white' : 'border-ink-300 bg-white'
        }`}
      >
        {selected && <Check size={12} strokeWidth={3} />}
      </div>
    </button>
  );
}

function PriceLine({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between py-1 text-[12px]">
      <span className="text-ink-700">{label}</span>
      <span className={`font-medium ${positive ? 'text-cerrado-700' : 'text-ink-900'}`}>{value}</span>
    </div>
  );
}

function Step({ done, active, label }: { done?: boolean; active?: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className={`flex h-5 w-5 items-center justify-center rounded-full ${
          done ? 'bg-white text-clay-600' : active ? 'bg-white text-clay-600' : 'bg-white/30 text-white'
        }`}
      >
        {done ? <Check size={12} strokeWidth={3.5} /> : <span className="text-[10px] font-extrabold">3</span>}
      </div>
      <span className={active ? 'text-white' : 'text-white/85'}>{label}</span>
    </div>
  );
}

function Bar() {
  return <div className="h-px flex-1 bg-white/40" />;
}
