import Link from 'next/link';
import { ArrowRight, ArrowRightLeft, BadgeCheck, Bus, Calendar, Clock, MapPin, ShieldCheck, Ticket, Users } from 'lucide-react';
import {
  AppFrame,
  AppHeader,
  Band,
  Divider,
  HScroll,
  Pill,
  SectionHeader,
  TabBar,
} from '@/components/carmo';
import { DESTINATIONS, formatBRL, formatDuration, listSchedulesFor } from '@/lib/passagens/mock';

export const metadata = {
  title: 'Passagens de ônibus — Portal Carmelitano',
  description:
    'Compre passagens de ônibus a partir de Carmo do Rio Claro. Sul Minas (ex-Santa Cruz) e parceiras, com bilhete digital.',
};

const POPULAR = ['alfenas', 'passos', 'belo-horizonte', 'sao-paulo'];

export default async function PassagensPage() {
  const todaySchedules = listSchedulesFor('alfenas').slice(0, 4);
  const popular = DESTINATIONS.filter((d) => POPULAR.includes(d.slug));
  const others = DESTINATIONS.filter((d) => !POPULAR.includes(d.slug));

  return (
    <AppFrame>
      <AppHeader chips={['Sul Minas', 'Hoje', 'Mais barata', 'Direto']} />

      {/* Hero com busca embutida */}
      <div className="relative mx-3 mt-2.5 overflow-hidden rounded-md md:mx-6 lg:mx-8">
        <div className="absolute inset-0 bg-clay-500" />
        <div
          className="absolute inset-0 opacity-90"
          style={{
            background:
              'linear-gradient(155deg, transparent 50%, var(--carmo-cerrado-700) 50.5%)',
          }}
        />
        <div className="relative z-10 px-4 pt-5 pb-5 md:px-6 lg:px-8">
          <div className="flex items-center gap-1.5 text-[12px] font-semibold text-white/95">
            <Ticket size={14} strokeWidth={2.5} />
            Bilhete digital · embarque com QR
          </div>
          <h1 className="m-0 mt-2 max-w-[80%] font-display text-[32px] font-extrabold leading-[1.05] tracking-[-0.01em] text-white lg:max-w-[560px] lg:text-[44px]">
            De Carmo pra onde quiser
          </h1>
          <p className="m-0 mt-2 max-w-[85%] text-[13px] font-medium text-white/90">
            Sul Minas (ex-Santa Cruz) e parceiras. Mesma poltrona da rodoviária, comprada do sofá.
          </p>

          {/* Search card */}
          <SearchCard />
        </div>
      </div>

      {/* Trust strip */}
      <Band className="px-3.5 pt-3 pb-1">
        <div className="flex items-stretch gap-2">
          <TrustItem icon={ShieldCheck} title="Pagamento" sub="PIX em 5s" />
          <TrustItem icon={BadgeCheck} title="Mesma poltrona" sub="da rodoviária" />
          <TrustItem icon={Bus} title="Sul Minas" sub="oficial" />
        </div>
      </Band>

      <Divider />

      {/* Destinos populares */}
      <SectionHeader title="De Carmo pra..." kicker="Saídas diárias" />
      <HScroll>
        {popular.map((d) => (
          <Link
            key={d.slug}
            href={`/passagens/buscar?destino=${d.slug}`}
            className="block w-[200px] shrink-0 rounded-md border border-ink-100 bg-white no-underline transition-shadow hover:shadow-sm"
          >
            <div className="flex h-[88px] items-end justify-between bg-paper-deep px-3 pt-3 pb-2">
              <span className="text-[36px] leading-none">{d.illo}</span>
              {d.highlight && (
                <span className="rounded-full bg-clay-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  {d.highlight}
                </span>
              )}
            </div>
            <div className="px-3 py-3">
              <div className="text-[11px] font-bold uppercase tracking-[0.04em] text-clay-600">
                {d.uf}
              </div>
              <h3 className="m-0 mt-0.5 font-sans text-[15px] font-extrabold text-ink-900">
                {d.city}
              </h3>
              <div className="mt-2 flex items-center gap-3 text-[11px] text-ink-600">
                <span className="inline-flex items-center gap-1">
                  <Clock size={12} strokeWidth={2.4} />
                  {formatDuration(d.durationMin)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Bus size={12} strokeWidth={2.4} />
                  {d.schedulesPerDay}/dia
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-[10px] text-ink-500">a partir de</span>
                <span className="font-display text-[18px] font-extrabold text-ink-900">
                  {formatBRL(d.fromPrice)}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </HScroll>

      <Divider />

      {/* Saídas de hoje (preview pra Alfenas) */}
      <SectionHeader
        title="Saindo hoje pra Alfenas"
        kicker="Mais procurado"
        action={{ label: 'Ver tudo', href: '/passagens/buscar?destino=alfenas' }}
      />
      <Band className="px-3.5">
        <div className="space-y-2">
          {todaySchedules.map((s) => (
            <Link
              key={s.id}
              href={`/passagens/${s.id}`}
              className="block rounded-md border border-ink-100 bg-white p-3 no-underline transition-colors hover:border-clay-300"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center">
                    <span className="font-display text-[18px] font-extrabold leading-none text-ink-900">
                      {s.departure}
                    </span>
                    <span className="mt-0.5 text-[10px] font-medium text-ink-500">CRC</span>
                  </div>
                  <div className="flex flex-col items-center text-ink-400">
                    <span className="text-[10px] font-medium">{formatDuration(s.durationMin)}</span>
                    <div className="my-1 h-px w-12 bg-ink-200" />
                    <span className="text-[10px] font-medium">direto</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-display text-[18px] font-extrabold leading-none text-ink-900">
                      {s.arrival}
                    </span>
                    <span className="mt-0.5 text-[10px] font-medium text-ink-500">ALF</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-[16px] font-extrabold text-clay-600">
                    {formatBRL(s.price)}
                  </div>
                  <div className="text-[10px] font-medium text-ink-500">{s.seatsLeft} lugares</div>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] text-ink-700">
                  <span className="inline-flex h-5 items-center rounded-full bg-cerrado-100 px-2 font-bold text-cerrado-700">
                    {s.operator.name}
                  </span>
                  <span className="text-ink-500">· {s.vehicleClass}</span>
                </div>
                {s.seatsLeft <= 5 && (
                  <span className="text-[10px] font-bold uppercase text-clay-600">
                    Últimos lugares
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </Band>

      <Divider />

      {/* Outros destinos — grade compacta */}
      <SectionHeader title="Outros destinos" />
      <Band className="px-3.5">
        <div className="grid grid-cols-2 gap-2">
          {others.map((d) => (
            <Link
              key={d.slug}
              href={`/passagens/buscar?destino=${d.slug}`}
              className="flex items-center justify-between rounded-md border border-ink-100 bg-white px-3 py-2.5 no-underline transition-colors hover:border-clay-300"
            >
              <div className="min-w-0">
                <div className="truncate font-sans text-[13px] font-bold text-ink-900">
                  {d.city}/{d.uf}
                </div>
                <div className="text-[10px] text-ink-500">{formatDuration(d.durationMin)} · {formatBRL(d.fromPrice)}</div>
              </div>
              <ArrowRight size={14} className="shrink-0 text-clay-500" strokeWidth={2.5} />
            </Link>
          ))}
        </div>
      </Band>

      <Divider />

      {/* Sul Minas — bloco institucional */}
      <SectionHeader title="Operadoras parceiras" />
      <Band className="px-3.5">
        <div className="rounded-md border border-cerrado-100 bg-cerrado-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-[0.04em] text-cerrado-700">
                Operadora oficial
              </div>
              <h3 className="m-0 mt-0.5 font-display text-[20px] font-extrabold leading-tight text-ink-900">
                Sul Minas
              </h3>
              <p className="m-0 mt-1 text-[12px] font-medium text-ink-700">
                Antiga <strong>Viação Santa Cruz</strong>. Atende Carmo do Rio Claro com saídas regulares pro
                Sul de Minas, Triângulo e capitais.
              </p>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white">
              <Bus size={22} className="text-cerrado-700" strokeWidth={2.2} />
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <Stat value="8" label="destinos" tone="cerrado" />
            <Stat value="26+" label="horários/dia" tone="cerrado" />
            <Stat value="4.6" label="avaliação" tone="cerrado" />
          </div>
        </div>

        <div className="mt-2 rounded-md border border-ink-100 bg-white p-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <h4 className="m-0 font-sans text-[14px] font-extrabold text-ink-900">
                Cristo Rei
              </h4>
              <p className="m-0 text-[11px] text-ink-600">Linhas regionais (Capitólio, Guapé)</p>
            </div>
            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-700">
              parceira
            </span>
          </div>
        </div>
      </Band>

      <Divider />

      {/* Como funciona */}
      <SectionHeader title="Como funciona" />
      <Band className="px-3.5">
        <ol className="m-0 list-none p-0">
          <Step
            n={1}
            title="Escolha origem, destino e data"
            sub="A gente compara horários da Sul Minas e parceiras."
          />
          <Step
            n={2}
            title="Selecione poltrona e pague no PIX"
            sub="Mesma poltrona da rodoviária. Confirma na hora."
          />
          <Step
            n={3}
            title="Embarque com QR no celular"
            sub="Sem fila. Passe na catraca, motorista valida."
            last
          />
        </ol>
      </Band>

      <Divider />

      {/* Garantias */}
      <Band variant="paper-deep" className="mx-3.5 my-2 rounded-md px-4 py-4 md:mx-6 lg:mx-8">
        <div className="flex items-start gap-3">
          <ShieldCheck size={22} className="shrink-0 text-cerrado-700" strokeWidth={2.2} />
          <div>
            <h4 className="m-0 font-sans text-[14px] font-extrabold text-ink-900">
              Sua compra garantida
            </h4>
            <p className="m-0 mt-1 text-[12px] text-ink-700">
              Cancelamento até 3h antes da viagem (taxa de 5% do operador). Reembolso via PIX em até 1 dia útil.
              Atendimento pela <Link href="/contato?tipo=passagens&pagina=%2Fpassagens&assunto=Passagens" className="text-sky-700 underline">central Portal Carmelitano</Link>.
            </p>
          </div>
        </div>
      </Band>

      <TabBar active="home" />
    </AppFrame>
  );
}

function SearchCard() {
  return (
    <form
      action="/passagens/buscar"
      className="mt-4 rounded-md bg-white p-3 shadow-[0_8px_24px_rgba(28,16,12,0.18)]"
    >
      <div className="flex items-stretch gap-2">
        <Field icon={MapPin} label="De" value="Carmo do Rio Claro" sub="MG" disabled />
        <button
          type="button"
          className="flex h-auto w-9 shrink-0 items-center justify-center self-center rounded-full border border-ink-200 bg-white text-ink-600"
          aria-label="Inverter"
        >
          <ArrowRightLeft size={14} strokeWidth={2.4} />
        </button>
        <SelectField icon={MapPin} label="Para" name="destino" />
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Field icon={Calendar} label="Ida" value="Hoje, 4 mai" sub="seg" />
        <Field icon={Users} label="Passageiros" value="1 adulto" />
      </div>
      <button
        type="submit"
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-clay-500 py-3 font-sans text-[15px] font-extrabold text-white transition-colors hover:bg-clay-600"
      >
        Buscar passagens
        <ArrowRight size={16} strokeWidth={2.6} />
      </button>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Pill label="Só ida" active />
        <Pill label="Ida e volta" />
        <Pill label="Estudante" />
        <Pill label="Idoso 60+" />
      </div>
    </form>
  );
}

function Field({
  icon: Icon,
  label,
  value,
  sub,
  disabled,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
  sub?: string;
  disabled?: boolean;
}) {
  return (
    <div
      className={`flex min-w-0 flex-1 flex-col rounded-md border ${
        disabled ? 'border-ink-100 bg-paper' : 'border-ink-200 bg-white'
      } px-3 py-2`}
    >
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.04em] text-ink-500">
        <Icon size={11} strokeWidth={2.5} />
        {label}
      </div>
      <div className="mt-0.5 truncate font-sans text-[14px] font-extrabold text-ink-900">
        {value}
        {sub && <span className="ml-1 text-[11px] font-medium text-ink-500">{sub}</span>}
      </div>
    </div>
  );
}

function SelectField({ icon: Icon, label, name }: { icon: typeof MapPin; label: string; name: string }) {
  return (
    <label className="flex min-w-0 flex-1 flex-col rounded-md border border-ink-200 bg-white px-3 py-2">
      <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.04em] text-ink-500">
        <Icon size={11} strokeWidth={2.5} />
        {label}
      </span>
      <select
        name={name}
        defaultValue="alfenas"
        className="mt-0.5 truncate border-none bg-transparent p-0 font-sans text-[14px] font-extrabold text-ink-900 outline-none"
      >
        {DESTINATIONS.map((d) => (
          <option key={d.slug} value={d.slug}>
            {d.city}/{d.uf}
          </option>
        ))}
      </select>
    </label>
  );
}

function TrustItem({ icon: Icon, title, sub }: { icon: typeof ShieldCheck; title: string; sub: string }) {
  return (
    <div className="flex flex-1 items-center gap-2 rounded-md border border-ink-100 bg-white px-3 py-2">
      <Icon size={16} className="shrink-0 text-cerrado-700" strokeWidth={2.2} />
      <div className="min-w-0">
        <div className="truncate text-[11px] font-extrabold text-ink-900">{title}</div>
        <div className="truncate text-[10px] text-ink-500">{sub}</div>
      </div>
    </div>
  );
}

function Stat({ value, label, tone }: { value: string; label: string; tone: 'cerrado' | 'clay' }) {
  const fg = tone === 'cerrado' ? 'text-cerrado-700' : 'text-clay-600';
  return (
    <div className="rounded-md bg-white px-2 py-2">
      <div className={`font-display text-[20px] font-extrabold leading-none ${fg}`}>{value}</div>
      <div className="mt-0.5 text-[10px] font-medium text-ink-600">{label}</div>
    </div>
  );
}

function Step({ n, title, sub, last }: { n: number; title: string; sub: string; last?: boolean }) {
  return (
    <li className={`flex gap-3 ${last ? '' : 'pb-3'}`}>
      <div className="relative flex shrink-0 flex-col items-center">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-clay-500 font-display text-[13px] font-extrabold text-white">
          {n}
        </div>
        {!last && <div className="mt-1 w-px flex-1 bg-ink-200" />}
      </div>
      <div className="pb-1">
        <div className="font-sans text-[14px] font-extrabold text-ink-900">{title}</div>
        <div className="mt-0.5 text-[12px] text-ink-600">{sub}</div>
      </div>
    </li>
  );
}
