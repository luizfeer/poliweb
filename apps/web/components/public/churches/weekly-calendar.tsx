import Link from 'next/link';
import { AlertCircle, CalendarDays, Clock, Sparkles } from 'lucide-react';
import { getChurchNameBySlug, weekdayLabels, weekdayOrder } from '@/lib/churches';
import type { ChurchScheduleItem, WeekdayKey } from '@/lib/churches';

const dateWeekdayToKey: Record<string, WeekdayKey> = {
  Sunday: 'domingo',
  Monday: 'segunda',
  Tuesday: 'terca',
  Wednesday: 'quarta',
  Thursday: 'quinta',
  Friday: 'sexta',
  Saturday: 'sabado',
};

function getTodayWeekday(): WeekdayKey {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'long',
  }).format(new Date());

  return dateWeekdayToKey[weekday] ?? 'domingo';
}

function getNextWeekdays(today: WeekdayKey, count: number): WeekdayKey[] {
  const start = weekdayOrder.indexOf(today);
  return Array.from({ length: count }, (_, index) => weekdayOrder[(start + index + 1) % weekdayOrder.length]);
}

export function WeeklyChurchCalendar({
  schedule,
  activeWeekday,
}: {
  schedule: ChurchScheduleItem[];
  activeWeekday?: WeekdayKey;
}) {
  const days = activeWeekday ? [activeWeekday] : weekdayOrder;
  const today = activeWeekday ?? getTodayWeekday();
  const todayItems = schedule.filter((item) => item.weekday === today);
  const nextDays = activeWeekday ? [] : getNextWeekdays(today, 6);

  return (
    <section className="min-w-0 space-y-3">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12px] font-bold uppercase tracking-normal text-clay-600">Programação semanal</p>
          <h2 className="text-[20px] font-extrabold leading-tight text-ink-900 sm:text-[22px]">Calendário religioso da cidade</h2>
        </div>
        <CalendarDays className="hidden shrink-0 text-cerrado-700 sm:block" size={28} aria-hidden="true" />
      </div>

      <div className="min-w-0 space-y-3 lg:hidden">
        <article className="overflow-hidden rounded-lg border border-clay-100 bg-white shadow-card">
          <header className="bg-clay-500 px-4 py-3 text-white">
            <div className="flex min-w-0 items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-normal text-white/85">Hoje</p>
                <h3 className="text-[18px] font-extrabold leading-tight">{weekdayLabels[today]}</h3>
              </div>
              <Sparkles size={20} className="shrink-0" aria-hidden="true" />
            </div>
          </header>
          <div className="space-y-2 p-3">
            {todayItems.length === 0 ? (
              <p className="rounded-md bg-paper p-3 text-[13px] leading-relaxed text-ink-700">
                Não há programação publicada para hoje.
              </p>
            ) : (
              todayItems.map((item) => <ScheduleLink key={item.id} item={item} prominent />)
            )}
          </div>
        </article>

        {nextDays.length > 0 ? (
          <div className="space-y-2">
            <p className="text-[12px] font-bold uppercase tracking-normal text-ink-600">Próximos dias</p>
            <div className="flex max-w-full gap-2 overflow-x-auto pb-1 no-scrollbar">
              {nextDays.map((weekday) => {
                const items = schedule.filter((item) => item.weekday === weekday);
                return (
                  <article
                    key={weekday}
                    className="min-w-[min(210px,78vw)] rounded-lg border border-ink-100 bg-white p-3 shadow-card"
                  >
                    <h3 className="text-[14px] font-extrabold text-ink-900">{weekdayLabels[weekday]}</h3>
                    <p className="mt-0.5 text-[11px] font-medium text-ink-600">
                      {items.length === 1 ? '1 horário' : `${items.length} horários`}
                    </p>
                    <div className="mt-3 space-y-2">
                      {items.length === 0 ? (
                        <p className="text-[12px] text-ink-600">Sem programação.</p>
                      ) : (
                        items.slice(0, 2).map((item) => <ScheduleLink key={item.id} item={item} compact />)
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      <div className="hidden min-w-0 items-start gap-3 lg:grid lg:grid-cols-2 xl:grid-cols-3">
        {days.map((weekday) => {
          const items = schedule.filter((item) => item.weekday === weekday);
          return (
            <article key={weekday} className="min-w-0 overflow-hidden rounded-lg border border-ink-100 bg-white shadow-card">
              <header className="border-b border-ink-100 bg-paper-deep px-3 py-2.5">
                <h3 className="text-[15px] font-extrabold text-ink-900">{weekdayLabels[weekday]}</h3>
                <p className="text-[11px] font-medium text-ink-600">
                  {items.length === 1 ? '1 horário' : `${items.length} horários`}
                </p>
              </header>
              <div className="space-y-2 p-3">
                {items.length === 0 ? (
                  <p className="text-[12px] leading-relaxed text-ink-600">Sem programação publicada.</p>
                ) : (
                  items.map((item) => <ScheduleLink key={item.id} item={item} />)
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ScheduleLink({
  item,
  compact = false,
  prominent = false,
}: {
  item: ChurchScheduleItem;
  compact?: boolean;
  prominent?: boolean;
}) {
  return (
    <Link
      href={`/comunidade/igrejas/${item.churchSlug}`}
      className={
        prominent
          ? 'block min-w-0 rounded-md border border-clay-100 bg-clay-50 p-3 hover:bg-clay-100 hover:no-underline'
          : 'block min-w-0 rounded-md border border-ink-100 bg-paper-card p-2.5 hover:bg-clay-50 hover:no-underline'
      }
    >
      <div className="flex min-w-0 items-center gap-1.5 text-[12px] font-extrabold text-clay-700">
        <Clock size={13} className="shrink-0" aria-hidden="true" />
        {item.time}
        {item.sourceStatus === 'needs_verification' ? (
          <AlertCircle className="ml-auto shrink-0 text-sun-500" size={14} aria-label="Horário a verificar" />
        ) : null}
      </div>
      <div
        className={
          prominent
            ? 'mt-1 break-words text-[15px] font-extrabold leading-snug text-ink-900'
            : 'mt-1 break-words text-[13px] font-bold leading-snug text-ink-900'
        }
      >
        {item.title}
      </div>
      <div
        className={
          compact
            ? 'mt-1 line-clamp-1 text-[12px] leading-snug text-ink-600'
            : 'mt-1 line-clamp-2 text-[12px] leading-snug text-ink-600'
        }
      >
        {getChurchNameBySlug(item.churchSlug)}
      </div>
      {!compact && item.note ? <div className="mt-1 text-[11px] leading-snug text-ink-600">{item.note}</div> : null}
    </Link>
  );
}
