'use client';

import { useState } from 'react';
import { Link } from '@/components/navigation/link';
import { Cloud, CloudRain, CloudSun, Droplets, Sun, ThermometerSun, Wind } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { WeatherDay, WeatherSnapshot } from '@/lib/weather';
import { cn } from '@/lib/utils';

type WeatherWidgetProps = {
  cityName: string;
  weather: WeatherSnapshot;
};

const tempFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 0,
});

const dayFormatter = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'short',
  timeZone: 'America/Sao_Paulo',
});

export function WeatherWidget({ cityName, weather }: WeatherWidgetProps) {
  const days = weather.daily.slice(0, 5);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedDay = days[selectedIndex] ?? days[0] ?? null;
  const selectedCode = selectedIndex === 0 ? weather.weatherCode : selectedDay?.weatherCode ?? null;
  const selectedRain = selectedIndex === 0 ? weather.precipitationProbability : selectedDay?.precipitationProbabilityMax ?? null;
  const selectedTemp = selectedIndex === 0 ? weather.currentTemperature : selectedDay?.temperatureMax ?? null;
  const selectedTitle = selectedIndex === 0 ? 'Como fica o tempo hoje' : `Tempo para ${formatDayName(selectedDay?.date ?? null)}`;

  return (
    <section className="px-3.5 md:px-6 lg:px-8">
      <div className="overflow-hidden rounded-2xl border border-sky-100 bg-sky-50 shadow-card">
        <div className="grid gap-0 md:grid-cols-[1.05fr_0.95fr]">
          <div className="relative overflow-hidden bg-sky-700 p-4 text-white md:p-5">
            <div className="absolute -right-10 -top-12 h-36 w-36 rounded-full bg-white/10" />
            <div className="absolute -bottom-16 left-10 h-36 w-36 rounded-full bg-sun-300/20" />
            <div className="relative flex items-start justify-between gap-3">
              <div>
                <p className="m-0 text-[11px] font-bold uppercase tracking-[0.08em] text-sun-200">Previsão em {cityName}</p>
                <h2 className="m-0 mt-1 text-[20px] font-extrabold leading-tight md:text-[24px]">{selectedTitle}</h2>
                <p className="m-0 mt-2 max-w-md text-[13px] font-medium leading-relaxed text-white/84">
                  {humanWeatherPhrase({
                    code: selectedCode,
                    rain: selectedRain,
                    selectedIndex,
                    cityName,
                    dayKey: selectedDay?.date ?? 'today',
                    max: selectedDay?.temperatureMax ?? selectedTemp,
                    min: selectedDay?.temperatureMin ?? null,
                  })}
                </p>
                <Link
                  href="/servicos/clima"
                  className="mt-3 inline-flex rounded-md bg-white px-3 py-2 text-[12px] font-extrabold text-sky-700 hover:no-underline"
                >
                  Ver próximos dias
                </Link>
              </div>
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white/14">
                <WeatherConditionIcon code={selectedCode} size={30} className="text-sun-200" />
              </div>
            </div>

            <div className="relative mt-5 grid gap-4 md:grid-cols-[auto_1fr] md:items-end">
              <div>
                <div className="font-display text-[54px] font-extrabold leading-none">
                  {formatTemp(selectedTemp)}
                </div>
                <p className="m-0 mt-1 text-[14px] font-bold text-white">{labelForCode(selectedCode)}</p>
              </div>
              <div className="rounded-lg bg-white/10 p-3 text-[12px] font-semibold text-white/84">
                <p className="m-0 text-[11px] font-bold uppercase tracking-[0.08em] text-sun-200">Dica rápida</p>
                <p className="m-0 mt-1 text-[13px] font-semibold leading-relaxed text-white">
                  {practicalTip({
                    code: selectedCode,
                    rain: selectedRain,
                    dayKey: selectedDay?.date ?? 'today-tip',
                    max: selectedDay?.temperatureMax ?? null,
                    min: selectedDay?.temperatureMin ?? null,
                  })}
                </p>
                <div className="mt-3 grid gap-1.5 text-right">
                  <WeatherMeta icon={ThermometerSun} label="Sensação" value={selectedIndex === 0 ? formatTemp(weather.apparentTemperature) : `${formatTemp(selectedDay?.temperatureMin ?? null)} / ${formatTemp(selectedDay?.temperatureMax ?? null)}`} />
                  <WeatherMeta icon={Droplets} label="Chuva" value={formatPercent(selectedRain)} />
                  <WeatherMeta icon={Wind} label="Vento" value={selectedIndex === 0 ? formatWind(weather.windSpeed) : 'ver no dia'} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-0 bg-white md:min-h-full">
            {days.map((day, index) => (
              <ForecastDay
                key={day.date}
                day={day}
                today={index === 0}
                selected={index === selectedIndex}
                onSelect={() => setSelectedIndex(index)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ForecastDay({
  day,
  today,
  selected,
  onSelect,
}: {
  day: WeatherDay;
  today: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'border-r border-ink-100 p-3 text-center last:border-r-0 md:p-4',
        'transition-colors hover:bg-sky-50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-clay-500',
        selected ? 'bg-sky-50 shadow-[inset_0_3px_0_#0F4C81]' : 'bg-white',
      )}
      aria-pressed={selected}
    >
      <p className={cn('m-0 text-[11px] font-bold uppercase tracking-[0.04em]', selected ? 'text-sky-700' : 'text-ink-500')}>
        {today ? 'Hoje' : formatDayName(day.date)}
      </p>
      <div className={cn('mx-auto mt-3 grid h-9 w-9 place-items-center rounded-full', selected ? 'bg-sky-700 text-white' : 'bg-sky-50 text-sky-700')}>
        <WeatherConditionIcon code={day.weatherCode} size={20} />
      </div>
      <div className="mt-3 text-[13px] font-extrabold text-ink-900">
        {formatTemp(day.temperatureMax)}
      </div>
      <div className="text-[11px] font-semibold text-ink-500">{formatTemp(day.temperatureMin)}</div>
      <div className="mt-2 text-[10px] font-bold text-sky-700">{formatPercent(day.precipitationProbabilityMax)}</div>
    </button>
  );
}

function WeatherConditionIcon({
  code,
  size,
  className,
}: {
  code: number | null;
  size: number;
  className?: string;
}) {
  if (code === 0) return <Sun size={size} className={className} />;
  if (code !== null && [1, 2, 3, 45, 48].includes(code)) {
    return <CloudSun size={size} className={className} />;
  }
  if (code !== null && [51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) {
    return <CloudRain size={size} className={className} />;
  }
  if (code === null) return <CloudSun size={size} className={className} />;
  return <Cloud size={size} className={className} />;
}

function WeatherMeta({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center justify-end gap-1.5">
      <Icon size={14} />
      <span className="text-white/62">{label}</span>
      <strong className="font-extrabold text-white">{value}</strong>
    </div>
  );
}

function humanWeatherPhrase({
  code,
  rain,
  selectedIndex,
  cityName,
  dayKey,
  max,
  min,
}: {
  code: number | null;
  rain: number | null;
  selectedIndex: number;
  cityName: string;
  dayKey: string;
  max: number | null;
  min: number | null;
}): string {
  const when = selectedIndex === 0 ? 'Hoje' : 'Nesse dia';
  const bucket = phraseBucket(dayKey);
  if ((rain ?? 0) >= 70) {
    return pickVariant(bucket, [
      `${when} tem cara de dia para sair prevenido em ${cityName}. A chance de chuva está alta, então vale planejar deslocamentos com calma.`,
      `${when} pede guarda-chuva por perto. Se tiver roupa no varal, melhor não confiar muito no tempo.`,
      `${when} pode molhar a rotina. Bom deixar compromisso de rua para horários mais seguros, se der.`,
      `${when} combina mais com resolver o essencial e voltar para casa sem pressa. Chuva pode aparecer com força.`,
    ]);
  }
  if ((rain ?? 0) >= 40) {
    return pickVariant(bucket, [
      `${when} pode ter chuva em algum momento. Dá para resolver as coisas na rua, mas é bom ficar de olho no céu.`,
      `${when} está com cara de tempo indeciso. Varal só se você puder recolher rápido.`,
      `${when} dá para circular, mas uma sombrinha pequena evita dor de cabeça.`,
      `${when} não parece perdido, mas também não dá para sair contando com céu firme o dia todo.`,
    ]);
  }
  if ((min ?? 99) <= 12) {
    return pickVariant(bucket, [
      `${when} deve começar mais frio. Bom separar uma blusa, principalmente para sair cedo ou voltar à noite.`,
      `${when} tem cara de noite boa para dormir mais fresco, com coberta leve por perto.`,
      `${when} deve ficar mais friozinho em Carmo. Roupa de frio simples já resolve bem.`,
    ]);
  }
  if ((max ?? 0) >= 31) {
    return pickVariant(bucket, [
      `${when} deve esquentar bem. Água por perto e sombra nas horas mais fortes fazem diferença.`,
      `${when} é dia de calor mais firme. Bom evitar caminhada longa no sol do meio-dia.`,
      `${when} pede roupa leve e garrafinha cheia, principalmente para resolver coisas no centro.`,
    ]);
  }
  if ((min ?? 99) >= 18 && (max ?? 0) <= 27 && (rain ?? 0) < 25) {
    return pickVariant(bucket, [
      `${when} está com clima fresco e tranquilo. Bom para circular pela cidade sem muita preocupação.`,
      `${when} tem cara de tempo agradável, daqueles bons para resolver coisa na rua sem sofrer com calor.`,
      `${when} deve ficar equilibrado: nem muito quente, nem frio demais. Rotina mais confortável.`,
    ]);
  }
  if (code === 0 || code === 1) {
    return pickVariant(bucket, [
      `${when} tende a ser firme e mais aberto. Bom para compromissos fora de casa, caminhada ou passeio rápido pela cidade.`,
      `${when} parece bom para colocar roupa no varal e aproveitar a janela de sol.`,
      `${when} deve render bem para quem precisa sair cedo, caminhar ou resolver coisas na rua.`,
      `${when} tem cara de céu mais amigo. Boa chance de um dia simples de planejar.`,
    ]);
  }
  if (code === 2 || code === 3) {
    return pickVariant(bucket, [
      `${when} deve ficar com nuvens, mas sem cara de atrapalhar muito a rotina. Um dia mais ameno para circular.`,
      `${when} pode ficar mais fechado, daquele jeito bom para quem não gosta de sol forte.`,
      `${when} deve ser um dia mais tranquilo, com céu encoberto e temperatura mais comportada.`,
      `${when} não promete muito sol, mas também não parece ruim para sair.`,
    ]);
  }
  return pickVariant(bucket, [
    `${when} pede atenção antes de sair. A previsão ajuda a decidir roupa, horário e se vale levar proteção.`,
    `${when} pode variar um pouco. Melhor olhar de novo antes de viagem, evento ou compromisso ao ar livre.`,
    `${when} não está tão claro no radar. Planeje roupa e horário com alguma folga.`,
  ]);
}

function practicalTip({
  code,
  rain,
  dayKey,
  max,
  min,
}: {
  code: number | null;
  rain: number | null;
  dayKey: string;
  max: number | null;
  min: number | null;
}): string {
  const bucket = phraseBucket(dayKey);
  if ((rain ?? 0) >= 70) {
    return pickVariant(bucket, [
      'Leve guarda-chuva e evite deixar tarefas de rua para o fim da tarde.',
      'Roupa no varal só se tiver alguém para recolher rápido.',
      'Bom sair com calçado que aguente rua molhada.',
    ]);
  }
  if ((rain ?? 0) >= 40) {
    return pickVariant(bucket, [
      'Se for para a rua, deixe uma capa ou guarda-chuva pequeno por perto.',
      'Varal com atenção: o tempo pode virar sem muito aviso.',
      'Boa ideia conferir a previsão antes de lavar muita roupa.',
    ]);
  }
  if ((min ?? 99) <= 12) {
    return pickVariant(bucket, [
      'Separe uma blusa para o começo da manhã e para a noite.',
      'Noite boa para dormir mais fresco, talvez com coberta leve.',
      'Quem sai cedo deve sentir o friozinho primeiro.',
    ]);
  }
  if ((max ?? 0) >= 30) {
    return pickVariant(bucket, [
      'Calor mais forte: água por perto e sombra nas horas mais quentes.',
      'Roupa leve ajuda, principalmente se for andar no centro.',
      'Evite deixar caminhada ou exercício para o sol mais forte.',
    ]);
  }
  if (code === 0 || code === 1) {
    return pickVariant(bucket, [
      'Dia bom para aproveitar a cidade sem muita preocupação com chuva.',
      'Boa janela para lavar roupa e deixar secando com calma.',
      'Compromisso ao ar livre parece uma boa pedida.',
    ]);
  }
  if (code === 2 || code === 3) {
    return pickVariant(bucket, [
      'Céu mais fechado, mas ainda bom para compromissos rápidos.',
      'Clima mais tranquilo para circular sem sol batendo forte.',
      'Pode ser um dia bom para resolver coisa na rua sem pressa.',
    ]);
  }
  return pickVariant(bucket, [
    'Confira de novo mais tarde se tiver viagem, evento ou compromisso ao ar livre.',
    'Se tiver plano fora de casa, vale olhar a previsão antes de sair.',
    'Melhor deixar uma margem no horário se depender do tempo.',
  ]);
}

function phraseBucket(value: string): number {
  return [...value].reduce((total, char) => total + char.charCodeAt(0), 0);
}

function pickVariant(bucket: number, variants: string[]): string {
  return variants[bucket % variants.length] ?? variants[0] ?? '';
}

function formatTemp(value: number | null): string {
  return value === null ? '-' : `${tempFormatter.format(value)}°`;
}

function formatPercent(value: number | null): string {
  return value === null ? '-' : `${tempFormatter.format(value)}%`;
}

function formatWind(value: number | null): string {
  return value === null ? '-' : `${tempFormatter.format(value)} km/h`;
}

function formatDayName(value: string | null): string {
  if (!value) return 'dia';
  return dayFormatter.format(new Date(`${value}T12:00:00`)).replace('.', '');
}

function labelForCode(code: number | null): string {
  if (code === null) return 'Previsão disponível';
  if (code === 0) return 'Céu limpo';
  if (code === 1) return 'Poucas nuvens';
  if (code === 2) return 'Parcialmente nublado';
  if (code === 3) return 'Nublado';
  if ([45, 48].includes(code)) return 'Neblina';
  if ([51, 53, 55].includes(code)) return 'Garoa';
  if ([61, 63, 65].includes(code)) return 'Chuva';
  if ([80, 81, 82].includes(code)) return 'Pancadas de chuva';
  return 'Tempo instável';
}
