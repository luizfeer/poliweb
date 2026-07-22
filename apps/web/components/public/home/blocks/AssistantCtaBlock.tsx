import {
  ArrowRight,
  CalendarDays,
  Church,
  Fish,
  Landmark,
  Link2,
  Search,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import { Link } from '@/components/navigation/link';
import { Band } from '@/components/carmo';
import type { AssistantCtaConfig } from '@/lib/home';

type Props = { config: AssistantCtaConfig; title: string | null; cityName?: string };

const questionIcons: LucideIcon[] = [Link2, Church, CalendarDays, Trash2, Fish, Landmark];

const defaultQuestions = [
  'Qual farmácia está de plantão hoje à noite?',
  'Tem missa ou culto esta semana? Qual horário?',
  'Que eventos acontecem neste fim de semana?',
  'Quando passa o caminhão de lixo no Jardim América?',
  'Onde alugar barco pra pescar tilápia na represa?',
  'O que a câmara aprovou nas últimas duas semanas?',
];

const legacyQuestions: Record<string, string> = {
  'Qual farmacia esta de plantao hoje?': defaultQuestions[0]!,
  'Tem missa ou culto esta semana?': defaultQuestions[1]!,
  'Quais eventos acontecem no fim de semana?': defaultQuestions[2]!,
};

function getCityLabel(cityName: string | undefined) {
  if (!cityName) return 'Carmo';
  if (cityName.startsWith('Carmo')) return 'Carmo';
  return cityName;
}

function getDisplayQuestions(questions: string[]) {
  const normalized = questions.map((question) => legacyQuestions[question] ?? question);
  const combined = [...normalized, ...defaultQuestions];

  return combined.filter((question, index) => combined.indexOf(question) === index).slice(0, 6);
}

export function AssistantCtaBlock({ config, title, cityName }: Props) {
  const href = config.href ?? '/assistente';
  const questions = getDisplayQuestions(config.questions ?? []);
  const cityLabel = getCityLabel(cityName);
  const questionSeparator = href.includes('?') ? '&' : '?';
  const badgeText =
    title && title !== 'Pergunte ao assistente' ? title : 'Assistente · Resumido por IA';

  return (
    <Band className="relative bg-[#171716] px-3.5 py-8 text-white md:px-6 lg:left-1/2 lg:w-screen lg:-translate-x-1/2 lg:px-8 lg:py-16">
      <div className="mx-auto grid max-w-[1336px] gap-8 lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)] lg:items-center lg:gap-16">
        <div className="min-w-0">
          <div className="text-sun-500 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-[11px] font-extrabold tracking-[0.08em] uppercase">
            <span className="bg-sun-500 h-1.5 w-1.5 rounded-full" aria-hidden="true" />
            {badgeText}
          </div>
          <h2 className="font-display m-0 mt-5 max-w-[520px] text-[34px] leading-[0.98] font-extrabold text-white sm:text-[42px] lg:text-[50px]">
            O que você precisa <em className="text-sun-500">saber hoje</em> em {cityLabel}?
          </h2>
          <p className="m-0 mt-5 max-w-[470px] text-[15px] leading-relaxed text-white/86 md:text-[17px]">
            Pergunte sobre comércio, serviços públicos, eventos, turismo, transparência ou
            comunidade. A resposta vem com a fonte original, sempre.
          </p>
          <form
            action={href}
            method="get"
            className="mt-7 flex max-w-[535px] items-center gap-2 rounded-full bg-white p-2 pl-4 shadow-[0_18px_40px_rgba(0,0,0,0.25)]"
          >
            <Search
              className="text-ink-600 h-5 w-5 shrink-0"
              strokeWidth={1.9}
              aria-hidden="true"
            />
            <input
              type="search"
              name="q"
              aria-label={`Perguntar ao assistente de ${cityLabel}`}
              placeholder="Ex: Tem missa no domingo de manhã?"
              className="text-ink-900 placeholder:text-ink-600 min-w-0 flex-1 bg-transparent text-[14px] outline-none sm:text-[15px]"
            />
            <button
              type="submit"
              className="bg-clay-500 hover:bg-clay-600 focus-visible:outline-clay-500 flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-extrabold text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98] sm:px-5"
            >
              Perguntar
              <ArrowRight size={16} strokeWidth={2.2} aria-hidden="true" />
            </button>
          </form>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {questions.length > 0 ? (
            <>
              {questions.map((question, index) => {
                const Icon = questionIcons[index % questionIcons.length] ?? Link2;

                return (
                  <Link
                    key={`${question}-${index}`}
                    href={`${href}${questionSeparator}q=${encodeURIComponent(question)}`}
                    className="group hover:border-clay-300/45 focus-visible:outline-sun-500 flex min-h-[4.75rem] items-start gap-2 rounded-lg border border-white/10 bg-white/[0.075] p-3 text-white transition hover:bg-white/[0.11] hover:no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.99] sm:min-h-20 sm:items-center sm:gap-3 sm:p-4"
                  >
                    <span className="bg-clay-500/15 text-sun-500 group-hover:bg-clay-500/25 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition sm:h-10 sm:w-10">
                      <Icon className="h-4 w-4 sm:h-[19px] sm:w-[19px]" strokeWidth={2} aria-hidden="true" />
                    </span>
                    <span className="text-[12px] leading-snug font-extrabold text-white sm:text-[14px]">
                      {question}
                    </span>
                  </Link>
                );
              })}
            </>
          ) : null}
        </div>
      </div>
    </Band>
  );
}
