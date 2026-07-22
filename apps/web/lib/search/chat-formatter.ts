import type { SearchHit } from './types';

export type HitGroup = {
  entityType: string;
  label: string;
  intro: string;
  hits: SearchHit[];
};

const GROUP_META: Record<
  string,
  { label: string; intro: string; order: number }
> = {
  faq: { label: 'Resposta direta', intro: 'Encontrei uma resposta direta:', order: 0 },
  attraction: { label: 'O que fazer', intro: 'Atrações e passeios da região:', order: 1 },
  tourism_guide: { label: 'Guias turísticos', intro: 'Guias e roteiros da cidade:', order: 2 },
  accommodation: { label: 'Onde ficar', intro: 'Hospedagens recomendadas:', order: 3 },
  restaurant: { label: 'Onde comer', intro: 'Restaurantes e gastronomia:', order: 4 },
  fishing_guide: { label: 'Pesca e guias', intro: 'Guias de pesca e operadores:', order: 5 },
  tour_package: { label: 'Pacotes turísticos', intro: 'Pacotes e roteiros prontos:', order: 6 },
  business: { label: 'Comércios', intro: 'Comércios locais:', order: 7 },
  event: { label: 'Eventos', intro: 'Eventos e agenda:', order: 8 },
  property: { label: 'Imóveis', intro: 'Imóveis disponíveis:', order: 9 },
  classified: { label: 'Classificados', intro: 'Classificados:', order: 10 },
};

export function groupHitsByType(hits: SearchHit[]): HitGroup[] {
  const map = new Map<string, SearchHit[]>();
  for (const hit of hits) {
    const list = map.get(hit.entityType) ?? [];
    list.push(hit);
    map.set(hit.entityType, list);
  }

  const groups: HitGroup[] = [];
  for (const [entityType, list] of map) {
    const meta = GROUP_META[entityType];
    groups.push({
      entityType,
      label: meta?.label ?? entityType,
      intro: meta?.intro ?? `${entityType}:`,
      hits: list.sort((a, b) => b.score - a.score),
    });
  }

  groups.sort((a, b) => {
    const oa = GROUP_META[a.entityType]?.order ?? 99;
    const ob = GROUP_META[b.entityType]?.order ?? 99;
    return oa - ob;
  });

  return groups;
}

export function buildIntroText(groups: HitGroup[]): string | null {
  if (groups.length === 0) return null;

  const tourismTypes = new Set([
    'attraction',
    'tourism_guide',
    'accommodation',
    'restaurant',
    'fishing_guide',
    'tour_package',
  ]);
  const hasTourism = groups.some((g) => tourismTypes.has(g.entityType));
  const hasCommerce = groups.some((g) => g.entityType === 'business');
  const hasEvents = groups.some((g) => g.entityType === 'event');

  if (hasTourism && hasCommerce && hasEvents) {
    return 'Encontrei opções de turismo, comércio e eventos para você:';
  }
  if (hasTourism && hasCommerce) {
    return 'Encontrei opções de turismo e comércio para você:';
  }
  if (hasTourism) {
    return 'Procura turismo? Veja o que encontrei:';
  }
  if (hasCommerce) {
    return 'Encontrei comércios locais que podem te ajudar:';
  }
  if (hasEvents) {
    return 'Encontrei eventos na cidade:';
  }

  return 'Encontrei alguns resultados:';
}
