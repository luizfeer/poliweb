import Link from 'next/link';
import { Bus, Calendar, CheckCircle2, Download, MapPin, Share2, Ticket } from 'lucide-react';
import { AppFrame, Band, Divider, TabBar } from '@/components/carmo';

export const metadata = {
  title: 'Bilhete confirmado — Portal Carmelitano',
};

export default async function ConfirmacaoPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return (
    <AppFrame>
      {/* Hero de sucesso */}
      <div className="bg-cerrado-700 px-3.5 pt-6 pb-8 text-center text-white md:px-6 lg:px-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
          <CheckCircle2 size={32} strokeWidth={2.2} className="text-white" />
        </div>
        <h1 className="m-0 mt-3 font-display text-[28px] font-extrabold leading-tight">
          Bilhete confirmado
        </h1>
        <p className="m-0 mt-1 text-[13px] font-medium text-white/90">
          Mostre o QR no embarque ou imprima se preferir.
        </p>
      </div>

      {/* Bilhete (ticket) */}
      <Band className="-mt-5 px-3.5">
        <div className="overflow-hidden rounded-md bg-white shadow-[0_8px_24px_rgba(28,16,12,0.12)]">
          {/* Topo do ticket */}
          <div className="flex items-center justify-between border-b border-dashed border-ink-200 bg-paper-deep px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-cerrado-700 text-white">
                <Bus size={18} strokeWidth={2.4} />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.04em] text-ink-500">
                  Operadora
                </div>
                <div className="font-sans text-[13px] font-extrabold text-ink-900">Sul Minas</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase tracking-[0.04em] text-ink-500">
                Bilhete
              </div>
              <div className="font-display text-[14px] font-extrabold tracking-wider text-ink-900">
                {code}
              </div>
            </div>
          </div>

          {/* Trecho */}
          <div className="px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <span className="font-display text-[26px] font-extrabold leading-none text-ink-900">
                  06:15
                </span>
                <span className="mt-1 text-[10px] font-bold uppercase tracking-wide text-ink-500">
                  Carmo
                </span>
                <span className="text-[10px] text-ink-500">CRC</span>
              </div>
              <div className="flex flex-1 flex-col items-center text-ink-400">
                <span className="text-[10px] font-bold uppercase tracking-wide">2h00</span>
                <div className="my-1 flex w-full items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-clay-500" />
                  <div className="h-px flex-1 bg-clay-500" />
                  <Bus size={12} className="text-clay-500" strokeWidth={2.4} />
                  <div className="h-px flex-1 bg-clay-500" />
                  <div className="h-1.5 w-1.5 rounded-full bg-clay-500" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wide">direto</span>
              </div>
              <div className="flex flex-col text-right">
                <span className="font-display text-[26px] font-extrabold leading-none text-ink-900">
                  08:15
                </span>
                <span className="mt-1 text-[10px] font-bold uppercase tracking-wide text-ink-500">
                  Alfenas
                </span>
                <span className="text-[10px] text-ink-500">ALF</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 rounded-md bg-paper-deep p-2 text-center">
              <Cell label="Data" value="04/05" />
              <Cell label="Poltrona" value="9" highlight />
              <Cell label="Classe" value="Conv." />
            </div>

            <div className="mt-3 space-y-1.5 text-[12px]">
              <Detail label="Passageiro" value="Luiz Fernando Almeida" />
              <Detail label="CPF" value="***.***.***-12" />
              <Detail label="Embarque" value="Rodoviária Carmo · Av. Brasil, s/n" />
              <Detail label="Pagamento" value="PIX · pago em 04/05 · 04:21" />
            </div>
          </div>

          {/* QR */}
          <div className="border-t border-dashed border-ink-200 bg-white px-4 py-4">
            <div className="flex items-center gap-3">
              <div
                className="h-24 w-24 shrink-0 rounded-md border border-ink-200 bg-white"
                style={{
                  backgroundImage:
                    'repeating-conic-gradient(#1c100c 0% 25%, #fff 0% 50%) 50% / 8px 8px',
                }}
                aria-label="QR Code"
              />
              <div className="min-w-0">
                <div className="font-sans text-[13px] font-extrabold text-ink-900">
                  Apresente no embarque
                </div>
                <p className="m-0 mt-1 text-[11px] text-ink-600">
                  Motorista valida no leitor. Sem precisar imprimir. Chegue 20 min antes.
                </p>
              </div>
            </div>
          </div>

          {/* Rodapé */}
          <div className="flex items-center justify-between border-t border-ink-100 bg-paper-deep px-4 py-2 text-[11px] text-ink-600">
            <span>Total pago</span>
            <span className="font-display text-[14px] font-extrabold text-ink-900">R$ 30,87</span>
          </div>
        </div>

        {/* Ações */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-md border border-ink-200 bg-white py-3 text-[13px] font-extrabold text-ink-900 hover:border-clay-300"
          >
            <Download size={15} strokeWidth={2.4} />
            Baixar PDF
          </button>
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-md border border-ink-200 bg-white py-3 text-[13px] font-extrabold text-ink-900 hover:border-clay-300"
          >
            <Share2 size={15} strokeWidth={2.4} />
            Compartilhar
          </button>
        </div>
      </Band>

      <Divider />

      {/* Próximos passos */}
      <Band className="px-3.5 pt-3">
        <h3 className="m-0 mb-2 font-sans text-[15px] font-extrabold text-ink-900">
          Antes de embarcar
        </h3>
        <Tip icon={Calendar} title="Chegue 20 min antes" sub="A Sul Minas fecha embarque 5 min antes da saída." />
        <Tip icon={MapPin} title="Plataforma definida 30 min antes" sub="Acompanhe pelo painel da rodoviária." />
        <Tip
          icon={Ticket}
          title="Cancelamento até 3h antes"
          sub="Pelo painel da sua conta. Reembolso PIX em até 1 dia útil."
          last
        />
      </Band>

      <Divider />

      {/* Volta? */}
      <Band variant="paper-deep" className="mx-3.5 mb-2 rounded-md px-4 py-4">
        <h4 className="m-0 font-sans text-[14px] font-extrabold text-ink-900">
          Já pensou na volta?
        </h4>
        <p className="m-0 mt-1 text-[12px] text-ink-700">
          Tem horário de volta a partir de 17:30. Garanta sua poltrona agora.
        </p>
        <Link
          href="/passagens/buscar?destino=alfenas"
          className="mt-3 inline-flex items-center gap-2 rounded-md bg-clay-500 px-4 py-2 text-[13px] font-extrabold text-white no-underline hover:bg-clay-600"
        >
          Comprar volta
        </Link>
      </Band>

      <Band className="px-3.5 pb-4">
        <Link
          href="/painel/passagens"
          className="block rounded-md border border-ink-100 bg-white px-3 py-3 text-center font-sans text-[13px] font-extrabold text-sky-700 no-underline"
        >
          Ver minhas passagens
        </Link>
      </Band>

      <TabBar active="home" />
    </AppFrame>
  );
}

function Cell({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-md bg-white px-2 py-1.5">
      <div className="text-[10px] font-bold uppercase tracking-[0.04em] text-ink-500">{label}</div>
      <div
        className={`font-display text-[16px] font-extrabold leading-none ${
          highlight ? 'text-clay-600' : 'text-ink-900'
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-ink-500">{label}</span>
      <span className="truncate text-right font-medium text-ink-900">{value}</span>
    </div>
  );
}

function Tip({
  icon: Icon,
  title,
  sub,
  last,
}: {
  icon: typeof Calendar;
  title: string;
  sub: string;
  last?: boolean;
}) {
  return (
    <div className={`flex items-start gap-3 rounded-md border border-ink-100 bg-white p-3 ${last ? '' : 'mb-2'}`}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cerrado-100 text-cerrado-700">
        <Icon size={15} strokeWidth={2.4} />
      </div>
      <div className="min-w-0">
        <div className="font-sans text-[13px] font-extrabold text-ink-900">{title}</div>
        <div className="text-[11px] text-ink-600">{sub}</div>
      </div>
    </div>
  );
}
