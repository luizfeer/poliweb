export const ATTRACTION_KIND_LABELS: Record<string, string> = {
  balneario: 'Balneário',
  cachoeira: 'Cachoeira',
  historico: 'Histórico',
  igreja: 'Igreja',
  lago: 'Lago',
  mirante: 'Mirante',
  museu: 'Museu',
  parque: 'Parque',
  praia: 'Praia',
  trilha: 'Trilha',
};

export function attractionKindLabel(kind: string | null | undefined): string {
  if (!kind) return 'Atração';
  return ATTRACTION_KIND_LABELS[kind] ?? 'Atração';
}
