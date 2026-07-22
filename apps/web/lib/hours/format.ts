import type { HoursStatus } from './types';

const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];

export function formatStatusLabel(status: HoursStatus, locale = 'pt-BR'): string {
  if (status.sourceStatus === 'needs_verification') {
    return status.open ? 'Aberto • horario a verificar' : 'Fechado • horario a verificar';
  }

  if (status.open) {
    const closesAt = status.current?.end ? formatTime(status.current.end, locale) : null;
    return closesAt ? `Aberto • Fecha as ${closesAt}` : 'Aberto';
  }

  if (status.nextOpening) {
    const day = WEEKDAYS[status.nextOpening.weekday] ?? '';
    return `Fechado • Abre ${day} as ${formatTime(status.nextOpening.start, locale)}`;
  }

  return 'Fechado';
}

function formatTime(time: string, locale: string): string {
  const [hours = '0', minutes = '0'] = time.split(':');
  const date = new Date(Date.UTC(2020, 0, 1, Number(hours), Number(minutes)));

  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: Number(minutes) === 0 ? undefined : '2-digit',
    timeZone: 'UTC',
  }).format(date);
}
