import type { MetadataRoute } from 'next';
import { CATEGORIES } from '@/lib/businesses/categories';
import { resolvePublicSiteOrigin } from '@/lib/seo/site-origin';
import { createClient } from '@/lib/supabase/server';

type Entry = MetadataRoute.Sitemap[number];
type ChangeFreq = NonNullable<Entry['changeFrequency']>;

export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = resolvePublicSiteOrigin();
  const now = new Date();

  const make = (path: string, priority: number, changeFrequency: ChangeFreq, lastModified: Date = now): Entry => ({
    url: `${siteUrl}${path}`,
    lastModified,
    changeFrequency,
    priority,
  });

  const staticEntries: Entry[] = [
    make('', 1.0, 'daily'),
    make('/comercio', 0.9, 'daily'),
    make('/ao-vivo', 0.85, 'daily'),
    make('/turismo', 0.9, 'daily'),
    make('/imoveis', 0.9, 'daily'),
    make('/imobiliarias', 0.8, 'weekly'),
    make('/agenda', 0.9, 'daily'),
    make('/comunidade', 0.8, 'daily'),
    make('/classificados', 0.8, 'daily'),
    make('/servicos', 0.8, 'weekly'),
    make('/transparencia', 0.7, 'daily'),
    make('/balsas', 0.8, 'daily'),
    make('/anuncie', 0.7, 'monthly'),
    make('/sobre', 0.5, 'monthly'),
    make('/contato', 0.5, 'monthly'),
    make('/como-funciona', 0.5, 'monthly'),
    make('/como-funciona/comercio', 0.5, 'monthly'),
    make('/como-funciona/turismo', 0.5, 'monthly'),
    make('/mapa', 0.6, 'weekly'),
    make('/buscar', 0.6, 'weekly'),
    make('/assistente', 0.6, 'monthly'),
    make('/passagens', 0.6, 'weekly'),
    make('/sorteios', 0.7, 'daily'),
    make('/turismo/o-que-fazer', 0.85, 'weekly'),
    make('/turismo/onde-ficar', 0.85, 'weekly'),
    make('/turismo/onde-comer', 0.85, 'weekly'),
    make('/turismo/roteiros', 0.8, 'weekly'),
    make('/turismo/guias', 0.8, 'weekly'),
    make('/turismo/experiencias', 0.75, 'weekly'),
    make('/turismo/pacotes', 0.75, 'weekly'),
    make('/turismo/pesca', 0.8, 'weekly'),
    make('/turismo/pesca/pontos', 0.75, 'weekly'),
    make('/turismo/pesca/guias', 0.75, 'weekly'),
    make('/servicos/saude', 0.7, 'weekly'),
    make('/servicos/farmacias', 0.75, 'daily'),
    make('/servicos/energia', 0.6, 'weekly'),
    make('/servicos/clima', 0.7, 'daily'),
    make('/servicos/telefones', 0.6, 'monthly'),
    make('/servicos/coleta', 0.6, 'weekly'),
    make('/servicos/agua', 0.6, 'weekly'),
    make('/servicos/alertas', 0.6, 'weekly'),
    make('/classificados/veiculos', 0.7, 'daily'),
    make('/classificados/itens', 0.7, 'daily'),
    make('/classificados/servicos', 0.7, 'daily'),
    make('/classificados/vagas', 0.75, 'daily'),
    make('/classificados/buscar', 0.5, 'weekly'),
    make('/comunidade/agenda', 0.8, 'daily'),
    make('/comunidade/igrejas', 0.7, 'weekly'),
    make('/comunidade/grupos', 0.7, 'weekly'),
    make('/comunidade/grupos/whatsapp', 0.65, 'weekly'),
    make('/comunidade/pets', 0.65, 'daily'),
    make('/comunidade/achados', 0.65, 'daily'),
    make('/comunidade/obituarios', 0.6, 'daily'),
    make('/comunidade/classificados', 0.65, 'daily'),
    make('/comercio/buscar', 0.6, 'weekly'),
    make('/comercio/cadastro', 0.5, 'monthly'),
    make('/privacidade', 0.3, 'yearly'),
    make('/termos', 0.3, 'yearly'),
    make('/lgpd', 0.3, 'yearly'),
  ];

  const categoryEntries: Entry[] = CATEGORIES.map((c) => make(`/comercio/${c.slug}`, 0.6, 'weekly'));

  const supabase = await createClient();
  const PUBLISHED = 'published';
  const [
    businesses,
    events,
    classifieds,
    properties,
    attractions,
    accommodations,
    restaurants,
    tourismGuides,
    realtors,
    churches,
    ferryRoutes,
    raffles,
    fishingSpots,
    fishingGuides,
  ] = await Promise.all([
    supabase.from('businesses').select('slug, updated_at').eq('status', PUBLISHED).limit(5000),
    supabase.from('events').select('slug, updated_at').eq('status', PUBLISHED).limit(5000),
    supabase.from('classifieds').select('slug, updated_at, type').eq('status', PUBLISHED).eq('review_status', 'approved').limit(5000),
    supabase.from('properties').select('slug, updated_at').eq('status', PUBLISHED).eq('review_status', 'approved').limit(5000),
    supabase.from('attractions').select('slug, updated_at').eq('status', PUBLISHED).limit(5000),
    supabase.from('accommodations').select('slug, updated_at').eq('status', PUBLISHED).limit(5000),
    supabase.from('restaurants').select('slug, updated_at').eq('status', PUBLISHED).limit(5000),
    supabase.from('tourism_guides').select('slug, updated_at').eq('status', PUBLISHED).limit(5000),
    supabase.from('realtors').select('slug, updated_at').eq('status', PUBLISHED).limit(5000),
    supabase.from('churches').select('slug, updated_at').eq('status', PUBLISHED).limit(5000),
    supabase.from('ferry_routes').select('slug, updated_at').eq('active', true).limit(500),
    supabase.from('raffles').select('slug, updated_at').eq('status', 'active').limit(1000),
    supabase.from('fishing_spots').select('slug, created_at').eq('status', PUBLISHED).limit(5000),
    supabase.from('fishing_guides').select('slug, created_at').eq('status', PUBLISHED).limit(5000),
  ]);

  const dynamic: Entry[] = [];
  const ts = (v: string | null | undefined): Date => (v ? new Date(v) : now);
  const push = (path: string, lastModified: Date, priority = 0.6, changeFrequency: ChangeFreq = 'weekly') =>
    dynamic.push({ url: `${siteUrl}${path}`, lastModified, changeFrequency, priority });

  for (const r of businesses.data ?? []) push(`/comercio/negocio/${r.slug}`, ts(r.updated_at), 0.7, 'weekly');
  for (const r of events.data ?? []) push(`/comunidade/agenda/${r.slug}`, ts(r.updated_at), 0.7, 'daily');
  for (const r of classifieds.data ?? []) push(`${classifiedPath(r.type)}/${r.slug}`, ts(r.updated_at), 0.6, 'weekly');
  for (const r of properties.data ?? []) push(`/imoveis/${r.slug}`, ts(r.updated_at), 0.7, 'weekly');
  for (const r of attractions.data ?? []) push(`/turismo/o-que-fazer/${r.slug}`, ts(r.updated_at), 0.75, 'weekly');
  for (const r of accommodations.data ?? []) push(`/turismo/onde-ficar/${r.slug}`, ts(r.updated_at), 0.75, 'weekly');
  for (const r of restaurants.data ?? []) push(`/turismo/onde-comer/${r.slug}`, ts(r.updated_at), 0.75, 'weekly');
  for (const r of tourismGuides.data ?? []) push(`/turismo/guias/${r.slug}`, ts(r.updated_at), 0.7, 'weekly');
  for (const r of realtors.data ?? []) push(`/imobiliarias/${r.slug}`, ts(r.updated_at), 0.7, 'weekly');
  for (const r of churches.data ?? []) push(`/comunidade/igrejas/${r.slug}`, ts(r.updated_at), 0.65, 'weekly');
  for (const r of ferryRoutes.data ?? []) push(`/balsas/${r.slug}`, ts(r.updated_at), 0.8, 'daily');
  for (const r of raffles.data ?? []) push(`/sorteios/${r.slug}`, ts(r.updated_at), 0.7, 'daily');
  for (const r of fishingSpots.data ?? []) push(`/turismo/pesca/pontos/${r.slug}`, ts(r.created_at), 0.65, 'weekly');
  for (const r of fishingGuides.data ?? []) push(`/turismo/pesca/guias/${r.slug}`, ts(r.created_at), 0.65, 'weekly');

  return [...staticEntries, ...categoryEntries, ...dynamic];
}

function classifiedPath(type: string): string {
  if (type === 'vehicle') return '/classificados/veiculos';
  if (type === 'job') return '/classificados/vagas';
  if (type === 'service') return '/classificados/servicos';
  if (type === 'item') return '/classificados/itens';
  return '/classificados/buscar';
}
