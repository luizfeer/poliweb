const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  timeZone: 'America/Sao_Paulo',
});

export const fullDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  timeZone: 'America/Sao_Paulo',
});

export function formatShortDate(value: string | null): string {
  if (!value) return '-';
  return dateFormatter.format(new Date(value.includes('T') ? value : `${value}T12:00:00`)).replace('.', '');
}

export function formatFullDate(value: string): string {
  return fullDateFormatter.format(new Date(value.includes('T') ? value : `${value}T12:00:00`));
}
