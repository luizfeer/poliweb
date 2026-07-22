import type { EntityHoursRow, HoursStatus } from './types';

const TIME_ZONE = 'America/Sao_Paulo';

type LocalParts = {
  year: number;
  month: number;
  day: number;
  weekday: number;
  minutes: number;
};

export function weekdayInTZ(date: Date): number {
  return getLocalParts(date).weekday;
}

export function timeInTZ(date: Date): string {
  const minutes = getLocalParts(date).minutes;
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

export function isOpenNow(rows: EntityHoursRow[], now: Date): boolean {
  return Boolean(getCurrentRow(rows, now));
}

export function nextOpening(
  rows: EntityHoursRow[],
  now: Date,
): HoursStatus['nextOpening'] {
  const activeRows = rows.filter((row) => row.active);
  const parts = getLocalParts(now);

  for (let offset = 0; offset < 8; offset += 1) {
    const target = addLocalDays(parts, offset);
    const weekday = target.weekday;
    const rowsForDay = rowsForLocalDate(activeRows, target, weekday);
    const starts = rowsForDay
      .map((row) => ({ weekday, start: normalizeTime(row.startsAt), startMinutes: toMinutes(row.startsAt) }))
      .filter((item) => offset > 0 || item.startMinutes > parts.minutes)
      .sort((a, b) => a.startMinutes - b.startMinutes);

    if (starts[0]) {
      return { weekday: starts[0].weekday, start: starts[0].start };
    }
  }

  return undefined;
}

export function getStatus(rows: EntityHoursRow[], now: Date = new Date()): HoursStatus {
  const activeRows = rows.filter((row) => row.active);
  const current = getCurrentRow(activeRows, now);
  const sourceStatus = activeRows.some((row) => row.sourceStatus === 'needs_verification')
    ? 'needs_verification'
    : 'confirmed';

  if (current) {
    return {
      open: true,
      current: {
        start: normalizeTime(current.startsAt),
        end: current.endsAt ? normalizeTime(current.endsAt) : null,
      },
      nextChange: current.endsAt ? estimateNextChange(current, now) : null,
      sourceStatus,
    };
  }

  return {
    open: false,
    nextChange: null,
    nextOpening: nextOpening(activeRows, now),
    sourceStatus,
  };
}

function getCurrentRow(rows: EntityHoursRow[], now: Date): EntityHoursRow | null {
  const parts = getLocalParts(now);
  const previousParts = addLocalDays(parts, -1);
  const todayRows = rowsForLocalDate(rows, parts, parts.weekday);
  const previousRows = rowsForLocalDate(rows, previousParts, previousParts.weekday);

  return (
    todayRows.find((row) => containsMinute(row, parts.minutes)) ??
    previousRows.find((row) => containsMinuteFromPreviousDay(row, parts.minutes)) ??
    null
  );
}

function rowsForLocalDate(rows: EntityHoursRow[], parts: LocalParts, weekday: number): EntityHoursRow[] {
  const exceptions = rows.filter(
    (row) => row.kind === 'exception' && row.weekday === weekday && coversDate(row, parts),
  );

  if (exceptions.length > 0) {
    return exceptions.sort((a, b) => toMinutes(a.startsAt) - toMinutes(b.startsAt));
  }

  return rows
    .filter((row) => row.kind === 'regular' && row.weekday === weekday)
    .sort((a, b) => toMinutes(a.startsAt) - toMinutes(b.startsAt));
}

function coversDate(row: EntityHoursRow, parts: LocalParts): boolean {
  const dateKey = toDateKey(parts);
  return (!row.validFrom || row.validFrom <= dateKey) && (!row.validUntil || row.validUntil >= dateKey);
}

function containsMinute(row: EntityHoursRow, minute: number): boolean {
  const start = toMinutes(row.startsAt);
  const end = row.endsAt ? toMinutes(row.endsAt) : start;

  if (!row.endsAt) {
    return minute === start;
  }

  if (end < start) {
    return minute >= start || minute < end;
  }

  return minute >= start && minute < end;
}

function containsMinuteFromPreviousDay(row: EntityHoursRow, minute: number): boolean {
  if (!row.endsAt) return false;
  const start = toMinutes(row.startsAt);
  const end = toMinutes(row.endsAt);
  return end < start && minute < end;
}

function estimateNextChange(row: EntityHoursRow, now: Date): Date | null {
  if (!row.endsAt) return null;
  const parts = getLocalParts(now);
  const end = toMinutes(row.endsAt);
  const current = parts.minutes;
  const minutesUntilEnd = end > current ? end - current : 24 * 60 - current + end;
  return new Date(now.getTime() + minutesUntilEnd * 60 * 1000);
}

function toMinutes(time: string): number {
  const [hours = '0', minutes = '0'] = time.split(':');
  return Number(hours) * 60 + Number(minutes);
}

function normalizeTime(time: string): string {
  const [hours = '0', minutes = '0'] = time.split(':');
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
}

function getLocalParts(date: Date): LocalParts {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(value('weekday'));

  return {
    year: Number(value('year')),
    month: Number(value('month')),
    day: Number(value('day')),
    weekday,
    minutes: Number(value('hour')) * 60 + Number(value('minute')),
  };
}

function addLocalDays(parts: LocalParts, days: number): LocalParts {
  const utc = Date.UTC(parts.year, parts.month - 1, parts.day + days, 12, 0, 0);
  const next = getLocalParts(new Date(utc));
  return { ...next, minutes: parts.minutes };
}

function toDateKey(parts: LocalParts): string {
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
}
