/**
 * Rótulos PT-BR para slugs de comodidades (JSON em attractions.amenities, hospedagem, etc.).
 * Fallback: capitaliza palavras após normalizar underscores.
 */
const AMENITY_LABELS_PT: Record<string, string> = {
  banheiro: 'Banheiro',
  banheiros: 'Banheiros',
  criancas: 'Bom para crianças',
  grupos: 'Bom para grupos',
  estacionamento: 'Estacionamento',
  pet_friendly: 'Aceita pet',
  reservas: 'Aceita reservas',
  area_externa: 'Área externa',
  delivery: 'Delivery',
  retirada: 'Retirada',
  consumo_local: 'Consumo no local',
  musica_ao_vivo: 'Música ao vivo',
  credito: 'Cartão de crédito',
  debito: 'Cartão de débito',
  dinheiro: 'Dinheiro',
  aproximacao: 'Pagamento por aproximação',

  vista_360: 'Vista 360°',
  trilha: 'Trilha',
  voo_livre: 'Voo livre',
  jeep_4x4: 'Jeep 4x4',
  moto: 'Moto',
  capela: 'Capela',
  fotografia: 'Fotografia',
  experiencia_cafe_no_topo: 'Experiência café no topo',

  ponte_torta: 'Ponte Torta',
  lago_de_furnas: 'Lago de Furnas',
  passeio_de_lancha: 'Passeio de lancha',
  caiaque: 'Caiaque',
  pesca_esportiva: 'Pesca esportiva',
  por_do_sol: 'Pôr do sol',

  cachoeiras: 'Cachoeiras',
  pocos_naturais: 'Poços naturais',
  paredoes: 'Paredões',
  restaurante_rustico: 'Restaurante rústico',
  banho: 'Banho',
  natureza: 'Natureza',
  agua_cristalina: 'Água cristalina',

  poco_grande: 'Poço grande',
  bar_restaurante: 'Bar e restaurante',
  chuveiro: 'Chuveiro',

  arqueologia_indigena: 'Arqueologia indígena',
  mais_de_3000_pecas: 'Mais de 3 mil peças',
  visita_guiada: 'Visita guiada',
  visita_autoguiada: 'Visita autoguiada',
  educativo: 'Educativo',
  centro_historico: 'Centro histórico',
  ao_lado_da_matriz: 'Ao lado da matriz',
  sanitario: 'Sanitário',

  bom_para_familias: 'Bom para famílias',
};

function titleCaseWords(text: string): string {
  const parts = text
    .replace(/_/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return parts
    .map((word) => {
      if (/^\d+[a-z]*$/i.test(word)) return word;
      if (/^\d+x\d+$/i.test(word)) return word.toLowerCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

function normalizeAmenityKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, '_');
}

export function formatTourismAmenityLabel(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';

  const asciiKey = normalizeAmenityKey(trimmed);
  const mapped = AMENITY_LABELS_PT[asciiKey];
  if (mapped) return mapped;

  return titleCaseWords(asciiKey.replace(/_/g, ' '));
}
