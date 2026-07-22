import 'server-only';

import { listEvents } from '@/lib/community/queries';
import { getLatestCouncilMeeting } from '@/lib/transparency/queries';
import { getGarbageSchedule, getPharmacyOnDuty } from '@/lib/utilities/queries';

export type HeroCompositeQuickSlot = {
  kicker: string;
  title: string;
  sub: string | null;
  icon: string;
  href: string;
  tone: 'cerrado' | 'clay' | 'sky' | 'sun' | 'paper-deep';
};

const WEEKDAY_LABELS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const MONTH_LABELS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function formatHHmm(time: string | null): string {
  if (!time) return '';
  return time.slice(0, 5);
}

function buildGarbageSlot(
  schedule: Awaited<ReturnType<typeof getGarbageSchedule>>,
): HeroCompositeQuickSlot {
  const todayDow = new Date().getDay();
  let next: { dow: number; item: typeof schedule[0][0] } | null = null;
  for (let i = 0; i < 7; i += 1) {
    const dow = (todayDow + i) % 7;
    const list = schedule[dow] ?? [];
    const first = list[0];
    if (first) {
      next = { dow, item: first };
      break;
    }
  }

  if (!next) {
    return {
      kicker: 'Coleta',
      title: 'Sem agenda cadastrada',
      sub: 'Ver calendário completo',
      icon: 'Trash2',
      href: '/servicos/coleta',
      tone: 'cerrado',
    };
  }

  const isToday = next.dow === todayDow;
  const dayLabel = WEEKDAY_LABELS[next.dow]!;
  const time = formatHHmm(next.item.startTime);
  return {
    kicker: isToday ? 'Coleta hoje' : 'Próxima coleta',
    title: next.item.districtName || 'Setor cadastrado',
    sub: isToday
      ? time
        ? `Hoje, ${time}`
        : 'Confira o horário'
      : `${dayLabel}${time ? `, ${time}` : ''}`,
    icon: 'Trash2',
    href: '/servicos/coleta',
    tone: 'cerrado',
  };
}

function buildPharmacySlot(
  pharmacies: Awaited<ReturnType<typeof getPharmacyOnDuty>>,
): HeroCompositeQuickSlot {
  const first = pharmacies[0];
  if (!first) {
    return {
      kicker: 'Farmácia',
      title: 'Sem plantão cadastrado hoje',
      sub: 'Ver lista de farmácias',
      icon: 'Pill',
      href: '/servicos/farmacias',
      tone: 'clay',
    };
  }
  return {
    kicker: 'Farmácia 24h',
    title: first.name,
    sub: first.address ?? first.phone ?? 'Plantão de hoje',
    icon: 'Pill',
    href: '/servicos/farmacias',
    tone: 'clay',
  };
}

function buildEventSlot(events: Awaited<ReturnType<typeof listEvents>>): HeroCompositeQuickSlot {
  const next = events[0];
  if (!next) {
    return {
      kicker: 'Agenda',
      title: 'Sem eventos esta semana',
      sub: 'Ver agenda completa',
      icon: 'CalendarDays',
      href: '/agenda',
      tone: 'sky',
    };
  }
  const start = new Date(next.startAt);
  const dayLabel = WEEKDAY_LABELS[start.getDay()]!;
  const monthLabel = MONTH_LABELS[start.getMonth()]!;
  const sub = `${dayLabel} ${start.getDate()} ${monthLabel}${
    next.location ? ` · ${next.location}` : ''
  }`;
  return {
    kicker: 'Agenda',
    title: next.title,
    sub,
    icon: 'CalendarDays',
    href: `/agenda/${next.slug}`,
    tone: 'sky',
  };
}

function buildCouncilSlot(
  meeting: Awaited<ReturnType<typeof getLatestCouncilMeeting>>,
): HeroCompositeQuickSlot {
  if (!meeting) {
    return {
      kicker: 'Câmara',
      title: 'Sem sessões recentes',
      sub: 'Abrir painel de transparência',
      icon: 'Landmark',
      href: '/transparencia',
      tone: 'sun',
    };
  }
  const date = new Date(meeting.date);
  const dayLabel = WEEKDAY_LABELS[date.getDay()]!;
  const isToday = new Date().toDateString() === date.toDateString();
  return {
    kicker: 'Câmara',
    title: isToday
      ? 'Sessão hoje'
      : `Última sessão · ${dayLabel} ${date.getDate()}/${String(date.getMonth() + 1).padStart(2, '0')}`,
    sub: meeting.sessionType ?? 'Veja a pauta no painel',
    icon: 'Landmark',
    href: '/transparencia',
    tone: 'sun',
  };
}

export async function loadHeroCompositeQuickSlots(
  cityId: string,
  modules: string[],
): Promise<HeroCompositeQuickSlot[]> {
  const hasTransparency = modules.includes('transparency');

  const [garbage, pharmacies, events, council] = await Promise.all([
    getGarbageSchedule({ city_id: cityId }).catch(() => null),
    getPharmacyOnDuty({ city_id: cityId }).catch(() => []),
    listEvents({ city_id: cityId, when: 'month', limit: 1 }).catch(() => []),
    hasTransparency
      ? getLatestCouncilMeeting(cityId).catch(() => null)
      : Promise.resolve(null),
  ]);

  return [
    garbage
      ? buildGarbageSlot(garbage)
      : {
          kicker: 'Coleta',
          title: 'Sem agenda cadastrada',
          sub: 'Ver calendário completo',
          icon: 'Trash2',
          href: '/servicos/coleta',
          tone: 'cerrado',
        },
    buildPharmacySlot(pharmacies),
    buildEventSlot(events),
    buildCouncilSlot(council),
  ];
}
