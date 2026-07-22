/**
 * MVP: uma única cidade (Carmo do Rio Claro). Sem resolução por host, cookie ou path.
 * `DEFAULT_CITY_SLUG` no .env só altera qual slug buscar em `public.cities` (mesma app, uma linha).
 */
export const DEFAULT_CITY_SLUG = 'carmo-do-rio-claro';

export function getResolvedCitySlug(): string {
  const fromEnv = process.env.NEXT_PUBLIC_DEFAULT_CITY_SLUG?.trim().toLowerCase();
  return fromEnv && /^[a-z0-9-]+$/.test(fromEnv) ? fromEnv : DEFAULT_CITY_SLUG;
}
