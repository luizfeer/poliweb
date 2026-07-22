import type { ReactNode } from 'react';
import { Clock, Recycle, Trash2 } from 'lucide-react';
import { AppFrame, AppHeader, Band, Divider, TabBar } from '@/components/carmo';
import { GarbageWeekGrid } from '@/components/public/utilities/garbage-week-grid';
import { UtilityHero } from '@/components/public/utilities/utility-hero';
import { getCurrentCity } from '@/lib/cities';
import { getGarbageSchedule } from '@/lib/utilities/queries';

export const metadata = {
  title: 'Coleta de lixo em Carmo do Rio Claro - Portal Carmelitano',
  description: 'Veja os dias da coleta de lixo úmido e reciclável em Carmo do Rio Claro, MG.',
  keywords: [
    'coleta de lixo Carmo do Rio Claro',
    'lixo úmido Carmo do Rio Claro',
    'lixo reciclável Carmo do Rio Claro',
    'coleta seletiva Carmo do Rio Claro',
    'serviços públicos Carmo do Rio Claro',
  ],
};

const ORGANIC_EXAMPLES = [
  'restos de comida',
  'cascas de frutas',
  'lixo de banheiro',
  'guardanapos sujos',
  'resíduos domésticos não recicláveis',
];

const RECYCLABLE_EXAMPLES = [
  'papel',
  'papelão',
  'plástico',
  'garrafas PET',
  'latas',
  'metais',
  'vidro',
  'embalagens limpas',
];

const ORIENTATIONS = [
  {
    title: 'Separe o lixo corretamente',
    description:
      'Mantenha o lixo úmido separado do lixo reciclável para facilitar a coleta e a destinação correta dos resíduos.',
  },
  {
    title: 'Coloque o lixo no horário certo',
    description:
      'Evite deixar os sacos de lixo na rua muito antes da coleta para manter a cidade mais limpa e organizada.',
  },
  {
    title: 'Embale bem os resíduos',
    description:
      'Use sacos resistentes e bem fechados para evitar mau cheiro, sujeira e que animais espalhem o lixo.',
  },
];

function WasteCard({
  tone,
  icon,
  title,
  days,
  time,
  description,
  examples,
}: {
  tone: 'clay' | 'cerrado';
  icon: ReactNode;
  title: string;
  days: string;
  time: string;
  description: string;
  examples: string[];
}) {
  const classes =
    tone === 'clay'
      ? 'border-clay-200 bg-clay-50/70 text-clay-900'
      : 'border-cerrado-100 bg-cerrado-100/60 text-cerrado-700';

  return (
    <article className={`shadow-card rounded-2xl border p-4 ${classes}`}>
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white">
          {icon}
        </span>
        <div className="min-w-0">
          <h2 className="font-display m-0 text-[19px] font-extrabold leading-tight">{title}</h2>
          <p className="text-ink-800 m-0 mt-1 text-[13px] font-semibold">{days}</p>
        </div>
      </div>
      <p className="m-0 mt-3 flex items-center gap-1.5 text-[13px] font-bold">
        <Clock size={15} />
        {time}
      </p>
      <p className="text-ink-700 m-0 mt-2 text-[13px] leading-relaxed">{description}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {examples.map((example) => (
          <span
            key={example}
            className="text-ink-700 rounded-full border border-white/80 bg-white/80 px-2 py-0.5 text-[11px] font-semibold"
          >
            {example}
          </span>
        ))}
      </div>
    </article>
  );
}

export default async function ColetaPage() {
  const city = await getCurrentCity();
  if (!city) return null;

  const schedule = await getGarbageSchedule({ city_id: city.id });

  return (
    <AppFrame>
      <AppHeader chips={['Úmido', 'Reciclável', 'Serviços']} searchHref="/servicos" />
      <Band className="px-3.5 py-4">
        <UtilityHero
          icon={Trash2}
          kicker="Serviço público"
          title={`Coleta de lixo em ${city.name}`}
          description="Confira os dias da coleta de lixo úmido e reciclável, com orientações simples para deixar a rua mais limpa."
          stat={`${Object.values(schedule).flat().length} registros ativos no calendário.`}
          tone="clay"
        >
          <section className="border-clay-200 rounded-xl border bg-white p-3">
            <p className="text-clay-700 m-0 text-[12px] font-bold uppercase">Úmido</p>
            <p className="text-ink-900 m-0 mt-1 text-[14px] font-extrabold">
              Segunda, quarta e sexta
            </p>
          </section>
          <section className="border-cerrado-100 rounded-xl border bg-white p-3">
            <p className="text-cerrado-700 m-0 text-[12px] font-bold uppercase">Reciclável</p>
            <p className="text-ink-900 m-0 mt-1 text-[14px] font-extrabold">Terça e quinta</p>
          </section>
        </UtilityHero>
      </Band>

      <Band className="grid gap-3 px-3.5 py-3 md:grid-cols-2">
        <WasteCard
          tone="clay"
          icon={<Trash2 size={22} />}
          title="Lixo úmido / orgânico"
          days="Segunda, quarta e sexta"
          time="Antes do almoço"
          description="Coleta destinada a resíduos orgânicos e lixo comum doméstico."
          examples={ORGANIC_EXAMPLES}
        />
        <WasteCard
          tone="cerrado"
          icon={<Recycle size={22} />}
          title="Lixo seco / reciclável"
          days="Terça e quinta"
          time="À noite"
          description="Coleta destinada a materiais recicláveis e resíduos secos."
          examples={RECYCLABLE_EXAMPLES}
        />
      </Band>

      <Band className="space-y-2 px-3.5 pb-3">
        {ORIENTATIONS.map((item) => (
          <article
            key={item.title}
            className="border-ink-100 shadow-card rounded-xl border bg-white p-3"
          >
            <h2 className="m-0 text-[14px] font-extrabold">{item.title}</h2>
            <p className="text-ink-700 m-0 mt-1 text-[13px] leading-relaxed">{item.description}</p>
          </article>
        ))}
      </Band>

      <Divider />
      <Band className="px-3.5 py-3">
        <h2 className="font-display m-0 text-[20px] font-extrabold">Resumo da semana</h2>
        <p className="text-ink-600 m-0 mt-1 text-[13px]">
          Visão rápida por dia, com os registros ativos no banco.
        </p>
      </Band>
      <GarbageWeekGrid schedule={schedule} />
      <TabBar active="servicos" />
    </AppFrame>
  );
}
