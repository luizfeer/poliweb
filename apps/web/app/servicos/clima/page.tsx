import {
  Cloud,
  CloudRain,
  CloudSun,
  Droplets,
  MapPin,
  Shirt,
  Sun,
  ThermometerSun,
  Umbrella,
} from 'lucide-react';
import { AppFrame, AppHeader, Band, Divider } from '@/components/carmo';
import { getCurrentCity } from '@/lib/cities';
import { cn } from '@/lib/utils';
import { getWeatherClimateSummary, getWeatherForHome } from '@/lib/weather';
import type { WeatherClimateSummary, WeatherDay, WeatherSnapshot } from '@/lib/weather';

export const metadata = {
  title: 'Clima - Portal Carmelitano',
  description: 'Previsão do tempo, tendência da semana e contexto histórico do clima da cidade.',
};

const numberFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 0,
});

const decimalFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 1,
});

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  timeZone: 'America/Sao_Paulo',
});

export default async function ClimaPage() {
  const city = await getCurrentCity();
  if (!city) return null;

  const utilitiesEnabled = city.modules.includes('utilities');
  const [weather, climate] = await Promise.all([
    utilitiesEnabled ? getWeatherForHome(city) : Promise.resolve(null),
    getWeatherClimateSummary(city),
  ]);

  return (
    <AppFrame className="bg-paper">
      <AppHeader chips={['Serviços', 'Alertas', 'Farmácias', 'Coleta']} />

      <Band className="px-3.5 py-4 md:px-6 lg:px-8">
        <section className="border-ink-100 bg-ink-900 shadow-card relative overflow-hidden rounded-2xl border text-white">
          <CloudSun
            className="pointer-events-none absolute -bottom-12 -right-10 z-10 h-48 w-48 text-white/10"
            aria-hidden="true"
          />
          <div
            className={cn(
              'relative grid grid-cols-[minmax(0,1fr)] gap-0 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]',
              heroTone(weather),
            )}
          >
            <div className="min-w-0 p-4 md:p-6 lg:p-8">
              <p className="text-white/72 m-0 flex items-center gap-1.5 text-[12px] font-bold uppercase">
                <MapPin size={14} aria-hidden="true" />
                Clima em {city.name}
              </p>
              <h1 className="m-0 mt-3 max-w-2xl break-words text-[34px] font-extrabold leading-none md:text-[48px]">
                Previsão para sair de casa sem surpresa.
              </h1>
              <p className="text-white/82 m-0 mt-3 max-w-xl break-words text-[15px] font-medium leading-relaxed md:text-[17px]">
                Veja os próximos dias, chance de chuva, sensação térmica e como costuma ser o clima
                nesta época do ano.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <HeroPill
                  label={weather ? labelForCode(weather.weatherCode) : 'Previsão indisponível'}
                />
                <HeroPill
                  label={
                    climate
                      ? `Histórico ${climate.startYear}-${climate.endYear}`
                      : 'Histórico em atualização'
                  }
                />
                <HeroPill label="Fonte Open-Meteo" />
              </div>
            </div>
            <CurrentWeatherPanel weather={weather} climate={climate} />
          </div>
        </section>
      </Band>

      {!utilitiesEnabled ? (
        <Band className="px-3.5 py-5 md:px-6 lg:px-8">
          <p className="text-ink-700 m-0 rounded-md border bg-white p-4 text-[14px]">
            O módulo de serviços públicos ainda não está ativo nesta cidade.
          </p>
        </Band>
      ) : weather ? (
        <>
          <Divider />
          <ForecastOverview cityName={city.name} weather={weather} />
          <Divider />
          <Band className="grid gap-3 px-3.5 py-3 md:grid-cols-3 md:px-6 lg:px-8">
            {buildDailyInsights(weather).map((insight) => {
              const Icon = insight.icon;

              return (
                <section
                  key={insight.title}
                  className={cn('shadow-card rounded-lg border p-4', insight.className)}
                >
                  <Icon size={22} aria-hidden="true" />
                  <h2 className="m-0 mt-3 font-sans text-[16px] font-extrabold">{insight.title}</h2>
                  <p className="m-0 mt-1 text-[13px] font-medium leading-relaxed">{insight.text}</p>
                </section>
              );
            })}
          </Band>

          <Divider />
          <Band variant="paper-card" className="px-3.5 py-4 md:px-6 lg:px-8">
            <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
              <ClimateStory climate={climate} weather={weather} cityName={city.name} />
              <ForecastStrip days={weather.daily} />
            </div>
          </Band>

          <Divider />
          <Band className="px-3.5 py-4 md:px-6 lg:px-8">
            <SeasonCard climate={climate} weather={weather} />
          </Band>
        </>
      ) : (
        <Band className="px-3.5 py-5 md:px-6 lg:px-8">
          <p className="text-ink-700 m-0 rounded-md border bg-white p-4 text-[14px]">
            Não rolou carregar a previsão agora. Tente de novo em alguns segundos.
          </p>
        </Band>
      )}

      <Divider />
      <Band
        variant="paper-deep"
        className="text-ink-600 px-3.5 py-5 text-[12px] leading-relaxed md:px-6 lg:px-8"
      >
        <p className="m-0">
          Previsão e histórico são estimativas meteorológicas. Para alertas oficiais de risco,
          acompanhe também Defesa Civil e canais da prefeitura.
        </p>
      </Band>
    </AppFrame>
  );
}

function ForecastOverview({ cityName, weather }: { cityName: string; weather: WeatherSnapshot }) {
  const days = weather.daily.slice(0, 7);
  const todayDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

  return (
    <Band className="px-3.5 py-4 md:px-6 lg:px-8">
      <section className="shadow-card overflow-hidden rounded-2xl border border-sky-100 bg-white">
        <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="bg-sky-700 p-4 text-white md:p-6">
            <p className="text-sun-100 m-0 text-[12px] font-bold uppercase">
              Previsão em {cityName}
            </p>
            <h2 className="m-0 mt-2 text-[28px] font-extrabold leading-tight md:text-[34px]">
              Próximos dias
            </h2>
            <p className="text-white/86 m-0 mt-3 max-w-md text-[14px] font-medium leading-relaxed">
              Temperatura, chuva e condição do céu em um resumo direto para planejar rua, viagem
              curta, varal e compromisso ao ar livre.
            </p>
            <div className="bg-white/12 mt-5 rounded-lg p-3">
              <p className="text-sun-100 m-0 text-[12px] font-bold uppercase">Hoje</p>
              <p className="m-0 mt-1 text-[14px] font-semibold leading-relaxed">
                {forecastSummary(weather)}
              </p>
            </div>
          </div>

          <div className="bg-paper grid grid-cols-2 gap-2 p-3 md:grid-cols-4 xl:grid-cols-7">
            {days.map((day) => (
              <ForecastCard key={day.date} day={day} today={day.date === todayDate} />
            ))}
          </div>
        </div>
      </section>
    </Band>
  );
}

function ForecastCard({ day, today }: { day: WeatherDay; today: boolean }) {
  return (
    <article className="border-ink-100 shadow-card rounded-lg border bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="m-0 text-[11px] font-bold uppercase text-sky-700">
            {today ? 'Hoje' : formatDate(day.date)}
          </p>
          <h3 className="text-ink-900 m-0 mt-1 font-sans text-[14px] font-extrabold">
            {labelForCode(day.weatherCode)}
          </h3>
        </div>
        <div className={cn('grid h-9 w-9 place-items-center rounded-full', dayTone(day))}>
          <WeatherIcon code={day.weatherCode} size={19} />
        </div>
      </div>
      <div className="mt-4 flex items-end justify-between gap-2">
        <div>
          <p className="text-ink-900 m-0 text-[28px] font-extrabold leading-none">
            {formatTemp(day.temperatureMax)}
          </p>
          <p className="text-ink-500 m-0 mt-1 text-[12px] font-bold">
            mínima {formatTemp(day.temperatureMin)}
          </p>
        </div>
        <p className="m-0 rounded-full bg-sky-100 px-2 py-1 text-[12px] font-extrabold text-sky-700">
          {formatPercent(day.precipitationProbabilityMax)}
        </p>
      </div>
    </article>
  );
}

function CurrentWeatherPanel({
  weather,
  climate,
}: {
  weather: WeatherSnapshot | null;
  climate: WeatherClimateSummary | null;
}) {
  return (
    <div className="border-white/12 bg-black/18 min-w-0 border-t p-4 md:p-6 lg:border-l lg:border-t-0 lg:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-white/64 m-0 text-[12px] font-bold uppercase">Agora</p>
          <div className="font-display mt-2 text-[72px] font-extrabold leading-none">
            {formatTemp(weather?.currentTemperature ?? null)}
          </div>
          <p className="m-0 mt-1 text-[16px] font-extrabold">
            {labelForCode(weather?.weatherCode ?? null)}
          </p>
        </div>
        <div className="bg-white/14 text-sun-100 grid h-16 w-16 place-items-center rounded-full">
          <WeatherIcon code={weather?.weatherCode ?? null} size={34} />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Metric label="Sensação" value={formatTemp(weather?.apparentTemperature ?? null)} />
        <Metric label="Chuva" value={formatPercent(weather?.precipitationProbability ?? null)} />
        <Metric label="Vento" value={formatWind(weather?.windSpeed ?? null)} />
      </div>

      <div className="mt-4 rounded-lg bg-white/10 p-3">
        <p className="text-white/62 m-0 text-[12px] font-bold uppercase">Nesta época</p>
        <p className="m-0 mt-1 text-[14px] font-semibold leading-relaxed text-white">
          {climate
            ? `${capitalize(climate.monthLabel)} costuma ter máximas perto de ${formatTemp(climate.averageMax)} e ${formatRainyDays(climate.rainyDays)} com chuva.`
            : 'Histórico climático em atualização para a cidade.'}
        </p>
      </div>
    </div>
  );
}

function ClimateStory({
  climate,
  weather,
  cityName,
}: {
  climate: WeatherClimateSummary | null;
  weather: WeatherSnapshot;
  cityName: string;
}) {
  const averageMax = climate?.averageMax ?? null;
  const todayMax = weather.daily[0]?.temperatureMax ?? weather.currentTemperature;
  const difference =
    typeof todayMax === 'number' && typeof averageMax === 'number' ? todayMax - averageMax : null;

  return (
    <section>
      <p className="text-clay-600 m-0 text-[12px] font-bold uppercase">Leitura da época</p>
      <h2 className="m-0 mt-1 text-[24px] font-extrabold leading-tight">
        {climate ? `Como ${climate.monthLabel} costuma se comportar` : 'Histórico em atualização'}
      </h2>
      <p className="text-ink-700 m-0 mt-2 text-[14px] leading-relaxed">
        {climate
          ? buildClimatePhrase({ climate, cityName, difference })
          : 'Quando o histórico estiver disponível, esta área compara a previsão da semana com anos anteriores.'}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <StatCard label="Máxima média" value={formatTemp(climate?.averageMax ?? null)} />
        <StatCard label="Mínima média" value={formatTemp(climate?.averageMin ?? null)} />
        <StatCard label="Dias com chuva" value={formatRainyDays(climate?.rainyDays ?? null)} />
        <StatCard label="Chuva no mês" value={formatMillimeters(climate?.averageRainMm ?? null)} />
      </div>
    </section>
  );
}

function ForecastStrip({ days }: { days: WeatherDay[] }) {
  const maxRain = Math.max(...days.map((day) => day.precipitationProbabilityMax ?? 0), 1);

  return (
    <section className="border-ink-100 bg-paper shadow-card rounded-lg border p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="m-0 text-[12px] font-bold uppercase text-sky-700">Próximos dias</p>
          <h2 className="m-0 mt-0.5 font-sans text-[17px] font-extrabold">Temperatura e chuva</h2>
        </div>
        <CloudSun size={26} className="text-sky-700" aria-hidden="true" />
      </div>
      <div className="mt-3 grid gap-2">
        {days.map((day) => (
          <div
            key={day.date}
            className="grid grid-cols-[64px_1fr_70px] items-center gap-3 rounded-md bg-white p-2"
          >
            <div>
              <p className="text-ink-900 m-0 text-[12px] font-extrabold">{formatDate(day.date)}</p>
              <p className="text-ink-500 m-0 text-[11px] font-semibold">
                {labelForCode(day.weatherCode)}
              </p>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-sky-100">
              <div
                className={cn('h-full rounded-full', rainBarClass(day.precipitationProbabilityMax))}
                style={{
                  width: `${Math.max(((day.precipitationProbabilityMax ?? 0) / maxRain) * 100, 6)}%`,
                }}
              />
            </div>
            <div className="text-ink-900 text-right text-[12px] font-extrabold">
              {formatTemp(day.temperatureMin)} / {formatTemp(day.temperatureMax)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SeasonCard({
  climate,
  weather,
}: {
  climate: WeatherClimateSummary | null;
  weather: WeatherSnapshot;
}) {
  const currentMonth = climate?.month ?? 1;
  const months =
    climate?.monthly.slice(Math.max(currentMonth - 4, 0), Math.min(currentMonth + 2, 12)) ?? [];
  const peak = Math.max(...months.map((month) => month.averageRainMm ?? 0), 1);

  return (
    <section className="border-cerrado-100 bg-cerrado-50 shadow-card rounded-lg border p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-cerrado-700 m-0 text-[12px] font-bold uppercase">Ritmo do ano</p>
          <h2 className="m-0 mt-1 font-sans text-[18px] font-extrabold">Chuva por temporada</h2>
        </div>
        <Droplets size={24} className="text-cerrado-700" aria-hidden="true" />
      </div>
      <div className="mt-4 flex h-32 items-end gap-2">
        {months.map((month) => (
          <div key={month.month} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <div className="flex h-24 w-full items-end rounded-md bg-white/70 p-1">
              <div
                className={cn(
                  'w-full rounded-sm',
                  month.month === currentMonth ? 'bg-clay-500' : 'bg-cerrado-500',
                )}
                style={{ height: `${Math.max(((month.averageRainMm ?? 0) / peak) * 100, 8)}%` }}
              />
            </div>
            <span className="text-cerrado-700 max-w-full truncate text-[11px] font-bold">
              {month.monthLabel.slice(0, 3)}
            </span>
          </div>
        ))}
      </div>
      <p className="text-ink-700 m-0 mt-4 text-[13px] leading-relaxed">
        {practicalSeasonTip({ climate, weather })}
      </p>
    </section>
  );
}

function HeroPill({ label }: { label: string }) {
  return (
    <span className="bg-white/14 max-w-full rounded-full px-3 py-1.5 text-[12px] font-extrabold text-white">
      {label}
    </span>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md bg-white/10 p-2">
      <p className="text-white/58 m-0 text-[11px] font-bold">{label}</p>
      <p className="m-0 mt-0.5 text-[15px] font-extrabold text-white">{value}</p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-ink-100 rounded-md border bg-white p-3">
      <p className="text-ink-500 m-0 text-[11px] font-bold uppercase">{label}</p>
      <p className="text-ink-900 m-0 mt-1 text-[20px] font-extrabold">{value}</p>
    </div>
  );
}

function forecastSummary(weather: WeatherSnapshot): string {
  const today = weather.daily[0] ?? null;
  const rain = weather.precipitationProbability ?? today?.precipitationProbabilityMax ?? null;
  const max = today?.temperatureMax ?? weather.currentTemperature;
  if ((rain ?? 0) >= 60) {
    return 'Chance de chuva pede guarda-chuva e um pouco mais de margem no horário.';
  }
  if ((max ?? 0) >= 30) {
    return 'Dia mais quente. Água por perto e sombra nas horas fortes ajudam bastante.';
  }
  if (weather.weatherCode === 0 || weather.weatherCode === 1) {
    return 'Tempo mais aberto, bom para resolver coisa na rua e aproveitar uma janela de sol.';
  }
  return 'Tempo sem sinal de extremo agora. Vale conferir de novo antes de compromisso ao ar livre.';
}

function buildDailyInsights(weather: WeatherSnapshot) {
  const today = weather.daily[0] ?? null;
  const rain = weather.precipitationProbability ?? today?.precipitationProbabilityMax ?? null;
  const max = today?.temperatureMax ?? weather.currentTemperature;
  const min = today?.temperatureMin ?? null;

  return [
    {
      title: rain !== null && rain >= 50 ? 'Guarda-chuva por perto' : 'Rua sem muito aperto',
      text:
        rain !== null && rain >= 50
          ? 'Chance de chuva pede margem no horário, principalmente para mercado, escola e compromisso no centro.'
          : 'A previsão não aponta chuva forte agora. Ainda vale conferir antes de evento ao ar livre.',
      icon: Umbrella,
      className:
        rain !== null && rain >= 50
          ? 'border-sky-100 bg-sky-100 text-sky-700'
          : 'border-cerrado-100 bg-cerrado-50 text-cerrado-700',
    },
    {
      title: max !== null && max >= 30 ? 'Calor mais firme' : 'Temperatura comportada',
      text:
        max !== null && max >= 30
          ? 'Água por perto e sombra nas horas mais fortes ajudam, especialmente para caminhada e fila.'
          : 'Dia com temperatura mais fácil de encarar para resolver coisa fora de casa.',
      icon: ThermometerSun,
      className:
        max !== null && max >= 30
          ? 'border-clay-100 bg-clay-50 text-clay-700'
          : 'border-ink-100 bg-white text-ink-700',
    },
    {
      title: min !== null && min <= 13 ? 'Blusa cedo e à noite' : 'Roupa leve resolve',
      text:
        min !== null && min <= 13
          ? 'O começo da manhã e a volta para casa podem pedir uma camada a mais.'
          : 'Sem sinal de frio forte no recorte principal da previsão.',
      icon: Shirt,
      className:
        min !== null && min <= 13
          ? 'border-sky-100 bg-sky-50 text-sky-700'
          : 'border-sun-100 bg-sun-100 text-ink-900',
    },
  ];
}

function buildClimatePhrase({
  climate,
  cityName,
  difference,
}: {
  climate: WeatherClimateSummary;
  cityName: string;
  difference: number | null;
}): string {
  const base = `Em ${cityName}, ${climate.monthLabel} costuma ficar entre ${formatTemp(climate.averageMin)} e ${formatTemp(climate.averageMax)}, com cerca de ${formatRainyDays(climate.rainyDays)} de chuva.`;
  if (difference === null || Math.abs(difference) < 2) {
    return `${base} A previsão atual está bem perto desse padrão histórico.`;
  }
  if (difference > 0) {
    return `${base} Esta semana aparece um pouco mais quente que o normal para a época.`;
  }
  return `${base} Esta semana aparece mais fresca que o normal para a época.`;
}

function practicalSeasonTip({
  climate,
  weather,
}: {
  climate: WeatherClimateSummary | null;
  weather: WeatherSnapshot;
}): string {
  const rain =
    weather.precipitationProbability ?? weather.daily[0]?.precipitationProbabilityMax ?? null;
  if (rain !== null && rain >= 60) {
    return 'Boa tela para decidir varal, feira, visita em ponto turístico e deslocamento de moto. Hoje a chuva merece atenção.';
  }
  if ((climate?.averageRainMm ?? 0) >= 120) {
    return 'Mesmo quando a previsão do dia parece tranquila, esta é uma época em que pancadas podem aparecer com mais facilidade.';
  }
  return 'Use o histórico como contexto, não como promessa. A previsão dos próximos dias continua sendo o dado principal para planejar a rotina.';
}

function WeatherIcon({ code, size }: { code: number | null; size: number }) {
  if (code === 0) return <Sun size={size} aria-hidden="true" />;
  if (code !== null && [1, 2, 3, 45, 48].includes(code)) {
    return <CloudSun size={size} aria-hidden="true" />;
  }
  if (code !== null && [51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) {
    return <CloudRain size={size} aria-hidden="true" />;
  }
  return <Cloud size={size} aria-hidden="true" />;
}

function heroTone(weather: WeatherSnapshot | null): string {
  const rain =
    weather?.precipitationProbability ?? weather?.daily[0]?.precipitationProbabilityMax ?? 0;
  const max = weather?.daily[0]?.temperatureMax ?? weather?.currentTemperature ?? null;
  if (rain >= 55) return 'bg-sky-700';
  if (max !== null && max >= 30) return 'bg-clay-600';
  if (weather?.weatherCode === 0 || weather?.weatherCode === 1) return 'bg-cerrado-700';
  return 'bg-ink-900';
}

function rainBarClass(value: number | null): string {
  if ((value ?? 0) >= 60) return 'bg-sky-700';
  if ((value ?? 0) >= 35) return 'bg-clay-500';
  return 'bg-cerrado-500';
}

function dayTone(day: WeatherDay): string {
  if ((day.precipitationProbabilityMax ?? 0) >= 50) return 'bg-sky-100 text-sky-700';
  if ((day.temperatureMax ?? 0) >= 30) return 'bg-clay-50 text-clay-700';
  if (day.weatherCode === 0 || day.weatherCode === 1) return 'bg-sun-100 text-ink-900';
  return 'bg-cerrado-100 text-cerrado-700';
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
  if ([80, 81, 82].includes(code)) return 'Pancadas';
  return 'Tempo instável';
}

function formatTemp(value: number | null): string {
  return value === null ? '-' : `${numberFormatter.format(value)}°`;
}

function formatPercent(value: number | null): string {
  return value === null ? '-' : `${numberFormatter.format(value)}%`;
}

function formatWind(value: number | null): string {
  return value === null ? '-' : `${numberFormatter.format(value)} km/h`;
}

function formatRainyDays(value: number | null): string {
  return value === null ? '-' : `${decimalFormatter.format(value)} dias`;
}

function formatMillimeters(value: number | null): string {
  return value === null ? '-' : `${numberFormatter.format(value)} mm`;
}

function formatDate(date: string): string {
  return dateFormatter.format(new Date(`${date}T12:00:00`)).replace('.', '');
}

function capitalize(value: string): string {
  return value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : value;
}
