import type { BusinessCategory } from './types';

/**
 * Catálogo de categorias do guia comercial.
 *
 * Estrutura: macro categorias (sem `parent`) + folhas (`parent` = slug da macro).
 * Os ícones são nomes de export do `lucide-react` (resolvidos em `icon-map.ts`).
 *
 * Lista derivada das categorias scraped do cliqueiachei.com.br para Carmo do Rio Claro,
 * agrupadas em macros pra navegação ergonômica em mobile.
 */
export const CATEGORIES: BusinessCategory[] = [
  // ───────────────── Macros ─────────────────
  {
    slug: 'alimentacao',
    name: 'Alimentação',
    icon: 'UtensilsCrossed',
    blurb: 'Restaurantes, lanchonetes, padarias, mercados',
  },
  {
    slug: 'saude',
    name: 'Saúde',
    icon: 'HeartPulse',
    blurb: 'Clínicas, dentistas, farmácias, postos',
  },
  {
    slug: 'beleza',
    name: 'Beleza & estética',
    icon: 'Scissors',
    blurb: 'Cabeleireiros, manicure, barbearia, estética',
  },
  {
    slug: 'casa',
    name: 'Casa & decoração',
    icon: 'Home',
    blurb: 'Móveis, decoração, eletro, construção',
  },
  {
    slug: 'veiculos',
    name: 'Veículos',
    icon: 'Car',
    blurb: 'Mecânica, peças, borracharia, lavação',
  },
  {
    slug: 'servicos',
    name: 'Serviços',
    icon: 'Wrench',
    blurb: 'Pedreiro, eletricista, jardineiro, encanador',
  },
  {
    slug: 'compras',
    name: 'Compras',
    icon: 'ShoppingBag',
    blurb: 'Lojas, calçados, presentes, papelaria',
  },
  {
    slug: 'pousadas',
    name: 'Pousadas',
    icon: 'BedDouble',
    blurb: 'Pousadas, ranchos e hospedagens para ficar em Carmo',
  },
  {
    slug: 'turismo',
    name: 'Turismo',
    icon: 'MountainSnow',
    blurb: 'Atrações, pesca e passeios em Furnas',
  },
  {
    slug: 'educacao',
    name: 'Educação',
    icon: 'GraduationCap',
    blurb: 'Escolas, idiomas, cursos',
  },
  {
    slug: 'lazer',
    name: 'Lazer & entretenimento',
    icon: 'PartyPopper',
    blurb: 'Bares, festas, eventos, esportes',
  },
  {
    slug: 'industria',
    name: 'Indústria & comércio',
    icon: 'Factory',
    blurb: 'Indústria local, atacado',
  },
  {
    slug: 'agro',
    name: 'Agro & rural',
    icon: 'Sprout',
    blurb: 'Insumos, máquinas, veterinária, pecuária',
  },

  // ───────────────── Alimentação ─────────────────
  { slug: 'restaurantes', name: 'Restaurantes', parent: 'alimentacao', icon: 'Utensils' },
  { slug: 'lanchonete', name: 'Lanchonetes', parent: 'alimentacao', icon: 'Sandwich' },
  { slug: 'pizzaria', name: 'Pizzarias', parent: 'alimentacao', icon: 'Pizza' },
  { slug: 'padaria', name: 'Padarias', parent: 'alimentacao', icon: 'Cookie' },
  { slug: 'acougue', name: 'Açougues', parent: 'alimentacao', icon: 'Beef' },
  { slug: 'bar', name: 'Bares', parent: 'alimentacao', icon: 'Wine' },
  { slug: 'mercado', name: 'Mercados', parent: 'alimentacao', icon: 'ShoppingCart' },
  { slug: 'sorveteria', name: 'Sorveterias', parent: 'alimentacao', icon: 'IceCreamCone' },
  { slug: 'chocolateria', name: 'Chocolaterias', parent: 'alimentacao', icon: 'Candy' },
  { slug: 'disk-bebidas', name: 'Disk bebidas', parent: 'alimentacao', icon: 'Wine' },
  { slug: 'disk-gas', name: 'Disk gás', parent: 'alimentacao', icon: 'Flame' },
  { slug: 'conveniencia', name: 'Conveniências', parent: 'alimentacao', icon: 'Store' },

  // ───────────────── Saúde ─────────────────
  { slug: 'farmacia', name: 'Farmácias', parent: 'saude', icon: 'Pill' },
  { slug: 'farmacia-manipulacao', name: 'Farmácias de manipulação', parent: 'saude', icon: 'FlaskConical' },
  { slug: 'clinica', name: 'Clínicas médicas', parent: 'saude', icon: 'Stethoscope' },
  { slug: 'clinica-diagnostico', name: 'Clínicas e diagnósticos', parent: 'saude', icon: 'Microscope' },
  { slug: 'dentista', name: 'Dentistas', parent: 'saude', icon: 'Smile' },
  { slug: 'hospital', name: 'Hospitais e postos', parent: 'saude', icon: 'BriefcaseMedical' },
  { slug: 'oftalmologia', name: 'Oftalmologia', parent: 'saude', icon: 'Eye' },
  { slug: 'psicologia', name: 'Psicologia', parent: 'saude', icon: 'Brain' },
  { slug: 'fisioterapia', name: 'Fisioterapia', parent: 'saude', icon: 'Activity' },
  { slug: 'veterinaria', name: 'Veterinária', parent: 'saude', icon: 'PawPrint' },
  { slug: 'academia', name: 'Academias', parent: 'saude', icon: 'Dumbbell' },

  // ───────────────── Beleza ─────────────────
  { slug: 'cabeleireiro', name: 'Cabeleireiros', parent: 'beleza', icon: 'Scissors' },
  { slug: 'barbearia', name: 'Barbearias', parent: 'beleza', icon: 'Scissors' },
  { slug: 'manicure', name: 'Manicure & pedicure', parent: 'beleza', icon: 'Sparkles' },
  { slug: 'estetica', name: 'Estética', parent: 'beleza', icon: 'Sparkles' },
  { slug: 'depilacao', name: 'Depilação', parent: 'beleza', icon: 'Sparkles' },

  // ───────────────── Casa ─────────────────
  { slug: 'moveis', name: 'Móveis', parent: 'casa', icon: 'Sofa' },
  { slug: 'decoracao', name: 'Decoração', parent: 'casa', icon: 'Lamp' },
  { slug: 'construcao', name: 'Construção', parent: 'casa', icon: 'HardHat' },
  { slug: 'eletrodomestico', name: 'Eletrodomésticos', parent: 'casa', icon: 'WashingMachine' },
  { slug: 'eletronico', name: 'Eletrônicos', parent: 'casa', icon: 'Tv' },
  { slug: 'enxoval', name: 'Enxoval', parent: 'casa', icon: 'Bed' },
  { slug: 'calhas', name: 'Calhas', parent: 'casa', icon: 'House' },
  { slug: 'laje', name: 'Lajes', parent: 'casa', icon: 'Square' },
  { slug: 'antena', name: 'Antenas parabólicas', parent: 'casa', icon: 'Antenna' },
  { slug: 'ar-condicionado', name: 'Ar condicionado', parent: 'casa', icon: 'Wind' },

  // ───────────────── Veículos ─────────────────
  { slug: 'auto-eletrica', name: 'Auto elétrica', parent: 'veiculos', icon: 'Plug' },
  { slug: 'borracheiro', name: 'Borracharias', parent: 'veiculos', icon: 'Disc' },
  { slug: 'funilaria', name: 'Funilarias e pintura', parent: 'veiculos', icon: 'PaintBucket' },
  { slug: 'mecanica', name: 'Mecânicas', parent: 'veiculos', icon: 'Wrench' },
  { slug: 'lavajato', name: 'Lava-jatos', parent: 'veiculos', icon: 'Droplets' },
  { slug: 'pecas-veiculos', name: 'Peças e acessórios', parent: 'veiculos', icon: 'Cog' },
  { slug: 'concessionaria', name: 'Concessionárias', parent: 'veiculos', icon: 'CarFront' },

  // ───────────────── Serviços ─────────────────
  { slug: 'jardineiro', name: 'Jardineiros', parent: 'servicos', icon: 'TreePalm' },
  { slug: 'pedreiro', name: 'Pedreiros', parent: 'servicos', icon: 'HardHat' },
  { slug: 'eletricista', name: 'Eletricistas', parent: 'servicos', icon: 'Zap' },
  { slug: 'encanador', name: 'Encanadores', parent: 'servicos', icon: 'Wrench' },
  { slug: 'pintor', name: 'Pintores', parent: 'servicos', icon: 'PaintRoller' },
  { slug: 'assistencia-tecnica', name: 'Assistência técnica', parent: 'servicos', icon: 'Wrench' },
  { slug: 'informatica', name: 'Informática', parent: 'servicos', icon: 'Laptop' },
  { slug: 'funeraria', name: 'Funerárias e cemitérios', parent: 'servicos', icon: 'Flower' },

  // ───────────────── Compras ─────────────────
  { slug: 'roupa', name: 'Roupas', parent: 'compras', icon: 'Shirt' },
  { slug: 'calcado', name: 'Calçados', parent: 'compras', icon: 'Footprints' },
  { slug: 'aluguel-roupas', name: 'Aluguel de roupas', parent: 'compras', icon: 'Crown' },
  { slug: 'flores-presentes', name: 'Flores e presentes', parent: 'compras', icon: 'Flower2' },
  { slug: 'floricultura', name: 'Floriculturas', parent: 'compras', icon: 'Flower2' },
  { slug: 'embalagem', name: 'Embalagens', parent: 'compras', icon: 'Package' },

  // ───────────────── Turismo ─────────────────
  { slug: 'pousada', name: 'Pousadas', parent: 'pousadas', icon: 'BedDouble' },
  { slug: 'pesca', name: 'Pesca esportiva', parent: 'turismo', icon: 'Fish' },
  { slug: 'passeio', name: 'Passeios e roteiros', parent: 'turismo', icon: 'Map' },

  // ───────────────── Educação ─────────────────
  { slug: 'escola', name: 'Escolas', parent: 'educacao', icon: 'School' },
  { slug: 'idiomas', name: 'Escolas de idiomas', parent: 'educacao', icon: 'Languages' },

  // ───────────────── Lazer ─────────────────
  { slug: 'festa-evento', name: 'Festas e eventos', parent: 'lazer', icon: 'PartyPopper' },
  { slug: 'arte-cultura', name: 'Arte e cultura', parent: 'lazer', icon: 'Palette' },
  { slug: 'igreja', name: 'Igrejas', parent: 'lazer', icon: 'Church' },

  // ───────────────── Indústria ─────────────────
  { slug: 'industria-comercio', name: 'Indústria e comércio', parent: 'industria', icon: 'Factory' },
  { slug: 'enderecos-empresariais', name: 'Endereços empresariais', parent: 'industria', icon: 'Building2' },
  { slug: 'associacao-comercial', name: 'Associação comercial', parent: 'industria', icon: 'Briefcase' },

  // ───────────────── Agro ─────────────────
  { slug: 'animais', name: 'Animais', parent: 'agro', icon: 'PawPrint' },
];

/** Macro categorias (sem parent) — usadas no hub principal. */
export const MACRO_CATEGORIES: BusinessCategory[] = CATEGORIES.filter((c) => !c.parent);

/** Mapa rápido por slug. */
export const CATEGORY_BY_SLUG: Record<string, BusinessCategory> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c]),
);

/** Filhas de uma macro categoria. */
export function getChildren(macroSlug: string): BusinessCategory[] {
  return CATEGORIES.filter((c) => c.parent === macroSlug);
}

/** Resolve uma categoria (pode ser macro ou folha) e retorna ela + filhas. */
export function resolveCategory(slug: string): {
  category: BusinessCategory | undefined;
  children: BusinessCategory[];
  parent?: BusinessCategory;
} {
  const category = CATEGORY_BY_SLUG[slug];
  if (!category) return { category: undefined, children: [] };
  const children = getChildren(slug);
  const parent = category.parent ? CATEGORY_BY_SLUG[category.parent] : undefined;
  return { category, children, parent };
}
