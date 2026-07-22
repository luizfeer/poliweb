export type EntityHoursRow = {
  weekday: number;
  starts_at: string;
  ends_at: string | null;
  kind: 'regular' | 'exception';
  valid_from: string | null;
  valid_until: string | null;
  source_status: 'confirmed' | 'needs_verification';
  active: boolean;
};

export type HoursStatus = {
  open: boolean;
  current?: { start: string; end: string | null };
  nextOpening?: { weekday: number; start: string };
  sourceStatus: 'confirmed' | 'needs_verification';
};

const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];

export function getStatus(rows: EntityHoursRow[], now = new Date()): HoursStatus {
  const active = rows.filter((row) => row.active);
  const sourceStatus = active.some((row) => row.source_status === 'needs_verification')
    ? 'needs_verification'
    : 'confirmed';
  const parts = localParts(now);
  const current = active.find((row) => row.weekday === parts.weekday && contains(row, parts.minutes));

  if (current) {
    return {
      open: true,
      current: { start: current.starts_at.slice(0, 5), end: current.ends_at?.slice(0, 5) ?? null },
      sourceStatus,
    };
  }

  for (let offset = 0; offset < 8; offset += 1) {
    const weekday = (parts.weekday + offset) % 7;
    const candidate = active
      .filter((row) => row.weekday === weekday)
      .map((row) => ({ weekday, start: row.starts_at.slice(0, 5), minutes: toMinutes(row.starts_at) }))
      .filter((row) => offset > 0 || row.minutes > parts.minutes)
      .sort((a, b) => a.minutes - b.minutes)[0];
    if (candidate) {
      return { open: false, nextOpening: { weekday, start: candidate.start }, sourceStatus };
    }
  }

  return { open: false, sourceStatus };
}

export function formatStatusLabel(status: HoursStatus): string {
  if (status.sourceStatus === 'needs_verification') {
    return status.open ? 'Aberto, mas o horario precisa ser verificado.' : 'Fechado, com horario a verificar.';
  }

  if (status.open) {
    return status.current?.end ? `Aberto. Fecha as ${status.current.end}.` : 'Aberto agora.';
  }

  if (status.nextOpening) {
    return `Fechado. Abre ${WEEKDAYS[status.nextOpening.weekday]} as ${status.nextOpening.start}.`;
  }

  return 'Fechado.';
}

function contains(row: EntityHoursRow, minute: number): boolean {
  const start = toMinutes(row.starts_at);
  const end = row.ends_at ? toMinutes(row.ends_at) : start;
  if (!row.ends_at) return minute === start;
  if (end < start) return minute >= start || minute < end;
  return minute >= start && minute < end;
}

function toMinutes(time: string): number {
  const [hours = '0', minutes = '0'] = time.split(':');
  return Number(hours) * 60 + Number(minutes);
}

function localParts(date: Date): { weekday: number; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return {
    weekday: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(value('weekday')),
    minutes: Number(value('hour')) * 60 + Number(value('minute')),
  };
}
