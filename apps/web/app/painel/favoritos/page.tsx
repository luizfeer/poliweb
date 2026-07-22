import { Link } from '@/components/navigation/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentCity } from '@/lib/cities';
import { CATEGORY_BY_SLUG } from '@/lib/businesses';
import { formatCentsAsCurrency, LISTING_TYPE_LABELS, PROPERTY_TYPE_LABELS } from '@/lib/real-estate';
import type { ListingType, PropertyType } from '@/lib/real-estate';
import { requireProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { cn } from '@/lib/utils';
import {
  Bath,
  BedDouble,
  Building2,
  CalendarDays,
  ChevronRight,
  Heart,
  Home,
  MapPin,
  Search,
  Sparkles,
  Star,
  Store,
  type LucideIcon,
} from 'lucide-react';

type FavoritePropertyRow = {
  created_at: string | null;
  properties: {
    id: string;
    slug: string;
    title: string;
    listing_type: ListingType | null;
    property_type: PropertyType | null;
    price: number | null;
    rent_price: number | null;
    area_useful_m2: number | null;
    bedrooms: number | null;
    bathrooms: number | null;
    parking_spaces: number | null;
    cover_url: string | null;
    districts: { name: string | null } | null;
    realtors: { name: string | null; verified: boolean | null } | null;
  } | null;
};

type FavoriteProperty = {
  id: string;
  slug: string;
  title: string;
  listingType: ListingType;
  propertyType: PropertyType;
  priceLabel: string;
  districtName: string | null;
  coverUrl: string | null;
  realtorName: string | null;
  realtorVerified: boolean;
  areaUsefulM2: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parkingSpaces: number | null;
  favoritedAt: string | null;
};

type FavoriteBusinessRow = {
  created_at: string | null;
  businesses: {
    id: string;
    slug: string;
    name: string;
    short_description: string | null;
    address: string | null;
    cover_url: string | null;
    logo_url: string | null;
    verified: boolean | null;
    districts: { name: string | null } | null;
    business_category_assignments:
      | Array<{
          is_primary: boolean | null;
          business_categories: { slug: string; name: string } | null;
        }>
      | null;
  } | null;
};

type FavoriteBusiness = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  districtName: string | null;
  coverUrl: string | null;
  logoUrl: string | null;
  verified: boolean;
  categoryLabel: string;
  categorySlugs: string[];
  favoritedAt: string | null;
};

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  timeZone: 'America/Sao_Paulo',
});

export const metadata = { title: 'Favoritos - Portal Carmelitano' };

export default async function FavoritosPage() {
  const [auth, city] = await Promise.all([requireProfile(), getCurrentCity()]);
  const [businesses, properties] = city
    ? await Promise.all([
        listFavoriteBusinesses(auth.profile.id, city.id),
        listFavoriteProperties(auth.profile.id, city.id),
      ])
    : [[], []];
  const accommodationFavorites = businesses.filter(isAccommodationFavorite);
  const commerceFavorites = businesses.filter((business) => !isAccommodationFavorite(business));
  const hasAnyFavorites =
    commerceFavorites.length > 0 || accommodationFavorites.length > 0 || properties.length > 0;
  const metricActive: 'comercio' | 'pousadas' | 'imoveis' =
    commerceFavorites.length > 0
      ? 'comercio'
      : accommodationFavorites.length > 0
        ? 'pousadas'
        : properties.length > 0
          ? 'imoveis'
          : 'pousadas';

  return (
    <div className="space-y-5">
      <header className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="grid gap-5 border-b bg-[linear-gradient(135deg,#fff7ed_0%,#f8fafc_58%,#ecfeff_100%)] p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-bold uppercase text-clay-700 ring-1 ring-clay-200">
              <Heart className="size-3.5 fill-clay-500 text-clay-500" aria-hidden="true" />
              Seus favoritos
            </p>
            <h1 className="mt-3 max-w-2xl text-3xl font-bold leading-tight text-foreground sm:text-4xl">
              Lugares salvos para voltar depois.
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Reúna pousadas, imóveis e comércios de {city?.name ?? 'sua cidade'} em um só painel.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-lg bg-white/75 p-2 shadow-sm ring-1 ring-white/80">
            <MetricCard
              label="Comércio"
              value={commerceFavorites.length.toString()}
              active={metricActive === 'comercio'}
            />
            <MetricCard
              label="Pousadas"
              value={accommodationFavorites.length.toString()}
              active={metricActive === 'pousadas'}
            />
            <MetricCard label="Imóveis" value={properties.length.toString()} active={metricActive === 'imoveis'} />
          </div>
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-3 sm:p-5">
          <QuickLink href="/turismo/onde-ficar" icon={BedDouble} label="Onde ficar" text="Pousadas e hospedagens" />
          <QuickLink href="/imoveis/buscar" icon={Search} label="Buscar imóveis" text="Casas, chácaras e terrenos" />
          <QuickLink href="/comercio" icon={Store} label="Comércio local" text="Serviços e ofertas da cidade" />
        </div>
      </header>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="border-b">
              <div>
                <CardTitle className="text-xl">Comércio favorito</CardTitle>
                <CardDescription>
                  {commerceFavorites.length > 0
                    ? 'Lojas e prestadores salvos por você, filtrados pela cidade atual.'
                    : 'Salve negócios no coração na ficha pública para listá-los aqui.'}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {commerceFavorites.length > 0 ? (
                commerceFavorites.map((business) => (
                  <BusinessFavoriteCard key={business.id} business={business} variant="commerce" />
                ))
              ) : (
                <CommerceFavoritesPreview />
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="border-b">
              <div>
                <CardTitle className="text-xl">Pousadas favoritas</CardTitle>
                <CardDescription>
                  {accommodationFavorites.length > 0
                    ? 'Hospedagens salvas por você, filtradas pela cidade atual.'
                    : 'Salve hospedagens para comparar fotos, localização e contato antes de decidir onde ficar.'}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {accommodationFavorites.length > 0 ? (
                accommodationFavorites.map((business) => (
                  <BusinessFavoriteCard key={business.id} business={business} variant="accommodation" />
                ))
              ) : (
                <TourismFavoritesPreview />
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="border-b">
              <div>
                <CardTitle className="text-xl">Imóveis favoritos</CardTitle>
                <CardDescription>
                  {properties.length > 0
                    ? 'Anúncios salvos por você, filtrados pela cidade atual.'
                    : 'Quando você favoritar um imóvel, ele aparece aqui.'}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {properties.length > 0 ? (
                properties.map((property) => <PropertyFavoriteCard key={property.id} property={property} />)
              ) : (
                <EmptyFavorites />
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4">
          {!hasAnyFavorites ? (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Comece pelos favoritos</CardTitle>
                <CardDescription>
                  Explore comércio, pousadas ou imóveis e use o coração na ficha para guardar aqui.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : null}
          <Card className="border-clay-200 bg-clay-50 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-clay-800">
                <Sparkles className="size-4" aria-hidden="true" />
                Em breve
              </CardTitle>
              <CardDescription className="text-clay-800/75">
                Mais opções salvas aparecem aqui conforme novos serviços entram no portal.
              </CardDescription>
            </CardHeader>
          </Card>
        </aside>
      </section>
    </div>
  );
}

async function listFavoriteBusinesses(profileId: string, cityId: string): Promise<FavoriteBusiness[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('business_favorites')
    .select(
      `
      created_at,
      businesses!inner(
        id,
        slug,
        name,
        short_description,
        address,
        cover_url,
        logo_url,
        verified,
        districts(name),
        business_category_assignments(
          is_primary,
          business_categories(slug, name)
        )
      )
    `,
    )
    .eq('profile_id', profileId)
    .eq('businesses.city_id', cityId)
    .eq('businesses.status', 'published')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return ((data ?? []) as unknown as FavoriteBusinessRow[])
    .map((row) => {
      const business = row.businesses;
      if (!business) return null;
      const categories = [...(business.business_category_assignments ?? [])].sort(
        (a, b) => Number(b.is_primary) - Number(a.is_primary),
      );
      const categorySlugs = categories
        .map((assignment) => assignment.business_categories?.slug)
        .filter((slug): slug is string => Boolean(slug));
      const primaryCategory = categories.find((assignment) => assignment.business_categories)?.business_categories;

      return {
        id: business.id,
        slug: business.slug,
        name: business.name,
        description: business.short_description ?? business.address,
        districtName: business.districts?.name ?? null,
        coverUrl: business.cover_url,
        logoUrl: business.logo_url,
        verified: business.verified ?? false,
        categoryLabel: primaryCategory?.name ?? 'Comércio local',
        categorySlugs,
        favoritedAt: row.created_at,
      } satisfies FavoriteBusiness;
    })
    .filter((business): business is FavoriteBusiness => business !== null);
}

function isAccommodationFavorite(business: FavoriteBusiness) {
  return business.categorySlugs.some((slug) => slug === 'pousadas' || slug === 'pousada' || CATEGORY_BY_SLUG[slug]?.parent === 'pousadas');
}

async function listFavoriteProperties(profileId: string, cityId: string): Promise<FavoriteProperty[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('property_favorites')
    .select(
      `
      created_at,
      properties!inner(
        id,
        slug,
        title,
        listing_type,
        property_type,
        price,
        rent_price,
        area_useful_m2,
        bedrooms,
        bathrooms,
        parking_spaces,
        cover_url,
        districts(name),
        realtors(name, verified)
      )
    `,
    )
    .eq('profile_id', profileId)
    .eq('properties.city_id', cityId)
    .eq('properties.status', 'published')
    .eq('properties.review_status', 'approved')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return ((data ?? []) as unknown as FavoritePropertyRow[])
    .map((row) => {
      const property = row.properties;
      if (!property) return null;
      const listingType = property.listing_type ?? 'sale';
      const propertyType = property.property_type ?? 'apartment';
      const rawPrice = listingType === 'sale' ? property.price : (property.rent_price ?? property.price);

      return {
        id: property.id,
        slug: property.slug,
        title: property.title,
        listingType,
        propertyType,
        priceLabel: rawPrice === null ? 'Preço sob consulta' : formatCentsAsCurrency(Math.round(rawPrice * 100)),
        districtName: property.districts?.name ?? null,
        coverUrl: property.cover_url,
        realtorName: property.realtors?.name ?? null,
        realtorVerified: property.realtors?.verified ?? false,
        areaUsefulM2: property.area_useful_m2,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        parkingSpaces: property.parking_spaces,
        favoritedAt: row.created_at,
      } satisfies FavoriteProperty;
    })
    .filter((property): property is FavoriteProperty => property !== null);
}

function CommerceFavoritesPreview() {
  return (
    <div className="grid gap-4 rounded-lg border border-dashed bg-paper p-5 text-center sm:p-8">
      <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-white text-clay-700 shadow-sm">
        <Store className="size-7" aria-hidden="true" />
      </span>
      <div>
        <h2 className="m-0 text-xl font-bold">Negócios favoritos aparecem aqui</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Abra uma ficha em Comércio e toque no coração para salvar lojas, serviços e prestadores da cidade.
        </p>
      </div>
      <div>
        <Link
          href="/comercio"
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 hover:no-underline"
        >
          <Store className="size-4" aria-hidden="true" />
          Explorar comércio
        </Link>
      </div>
    </div>
  );
}

function TourismFavoritesPreview() {
  return (
    <div className="grid gap-4 rounded-lg border border-dashed bg-paper p-5 text-center sm:p-8">
      <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-white text-cerrado-700 shadow-sm">
        <BedDouble className="size-7" aria-hidden="true" />
      </span>
      <div>
        <h2 className="m-0 text-xl font-bold">Suas pousadas favoritas aparecem aqui</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Em Onde ficar, salve hospedagens para comparar fotos, localização e contato antes de reservar.
        </p>
      </div>
      <div>
        <Link
          href="/turismo/onde-ficar"
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 hover:no-underline"
        >
          <BedDouble className="size-4" aria-hidden="true" />
          Explorar pousadas
        </Link>
      </div>
    </div>
  );
}

function MetricCard({ label, value, active = false }: { label: string; value: string; active?: boolean }) {
  return (
    <div className={cn('rounded-md p-3 text-center', active ? 'bg-ink-900 text-white' : 'bg-paper text-ink-700')}>
      <p className="m-0 text-2xl font-extrabold leading-none">{value}</p>
      <p className="m-0 mt-1 text-[11px] font-bold uppercase">{label}</p>
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  label,
  text,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  text: string;
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      target="_blank"
      rel="noreferrer"
      className="group flex min-h-20 items-center gap-3 rounded-lg border bg-background p-3 text-foreground transition hover:border-clay-300 hover:bg-clay-50 hover:no-underline"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-clay-50 text-clay-700 transition group-hover:bg-white">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{label}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{text}</span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5" aria-hidden="true" />
    </Link>
  );
}

function BusinessFavoriteCard({
  business,
  variant,
}: {
  business: FavoriteBusiness;
  variant: 'accommodation' | 'commerce';
}) {
  const savedAt = business.favoritedAt ? dateFormatter.format(new Date(business.favoritedAt)) : null;
  const isAccommodation = variant === 'accommodation';
  const kicker = isAccommodation ? 'Pousada salva' : 'Comércio salvo';
  const PlaceholderIcon = isAccommodation ? BedDouble : Store;

  return (
    <Link
      href={`/comercio/negocio/${business.slug}`}
      prefetch={false}
      target="_blank"
      rel="noreferrer"
      className="group grid gap-3 rounded-lg border bg-background p-3 text-foreground transition hover:border-clay-300 hover:bg-clay-50 hover:no-underline sm:grid-cols-[156px_minmax(0,1fr)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-cerrado-100 sm:aspect-auto sm:min-h-32">
        {business.coverUrl ?? business.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={business.coverUrl ?? business.logoUrl ?? ''}
            alt={business.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-cerrado-700">
            <PlaceholderIcon className="size-10" aria-hidden="true" />
          </span>
        )}
        <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-1 text-[11px] font-extrabold text-ink-900 shadow-sm">
          {business.categoryLabel}
        </span>
      </div>

      <div className="min-w-0 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="m-0 text-sm font-extrabold text-clay-700">{kicker}</p>
            <h2 className="m-0 mt-1 line-clamp-2 text-lg font-bold leading-snug">{business.name}</h2>
            <p className="m-0 mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{business.districtName ?? 'Bairro não informado'}</span>
            </p>
          </div>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-clay-50 text-clay-700">
            <Heart className="size-4 fill-clay-500 text-clay-500" aria-hidden="true" />
          </span>
        </div>

        {business.description ? (
          <p className="m-0 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{business.description}</p>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
          <p className="m-0 flex min-w-0 items-center gap-1 text-xs font-medium text-muted-foreground">
            {business.verified ? <Star className="size-3 fill-sun-500 text-sun-500" aria-hidden="true" /> : null}
            <span className="truncate">{business.verified ? 'Ficha verificada' : 'Ficha pública'}</span>
          </p>
          {savedAt ? (
            <p className="m-0 flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <CalendarDays className="size-3.5" aria-hidden="true" />
              Salvo em {savedAt}
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

function PropertyFavoriteCard({ property }: { property: FavoriteProperty }) {
  const savedAt = property.favoritedAt ? dateFormatter.format(new Date(property.favoritedAt)) : null;

  return (
    <Link
      href={`/imoveis/${property.slug}`}
      prefetch={false}
      target="_blank"
      rel="noreferrer"
      className="group grid gap-3 rounded-lg border bg-background p-3 text-foreground transition hover:border-clay-300 hover:bg-clay-50 hover:no-underline sm:grid-cols-[156px_minmax(0,1fr)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-cerrado-100 sm:aspect-auto sm:min-h-32">
        {property.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={property.coverUrl}
            alt={property.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-cerrado-700">
            <Home className="size-10" aria-hidden="true" />
          </span>
        )}
        <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-1 text-[11px] font-extrabold text-ink-900 shadow-sm">
          {LISTING_TYPE_LABELS[property.listingType]}
        </span>
      </div>

      <div className="min-w-0 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="m-0 text-sm font-extrabold text-clay-700">{property.priceLabel}</p>
            <h2 className="m-0 mt-1 line-clamp-2 text-lg font-bold leading-snug">{property.title}</h2>
            <p className="m-0 mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{property.districtName ?? 'Bairro não informado'}</span>
            </p>
          </div>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-clay-50 text-clay-700">
            <Heart className="size-4 fill-clay-500 text-clay-500" aria-hidden="true" />
          </span>
        </div>

        <div className="flex flex-wrap gap-2 text-xs font-semibold text-ink-700">
          <Pill icon={Building2} label={PROPERTY_TYPE_LABELS[property.propertyType]} />
          <Pill icon={Home} label={property.areaUsefulM2 ? `${Math.round(property.areaUsefulM2)} m²` : 'Área a consultar'} />
          <Pill icon={BedDouble} label={property.bedrooms ? `${property.bedrooms} quarto(s)` : 'Quartos a consultar'} />
          <Pill icon={Bath} label={property.bathrooms ? `${property.bathrooms} banho(s)` : 'Banhos a consultar'} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
          <p className="m-0 flex min-w-0 items-center gap-1 text-xs font-medium text-muted-foreground">
            {property.realtorVerified ? <Star className="size-3 fill-sun-500 text-sun-500" aria-hidden="true" /> : null}
            <span className="truncate">{property.realtorName ?? 'Anunciante particular'}</span>
          </p>
          {savedAt ? (
            <p className="m-0 flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <CalendarDays className="size-3.5" aria-hidden="true" />
              Salvo em {savedAt}
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

function Pill({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-paper px-2.5 py-1">
      <Icon className="size-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}

function EmptyFavorites() {
  return (
    <div className="grid gap-4 rounded-lg border border-dashed bg-paper p-5 text-center sm:p-8">
      <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-white text-clay-700 shadow-sm">
        <Heart className="size-7" aria-hidden="true" />
      </span>
      <div>
        <h2 className="m-0 text-xl font-bold">Nenhum favorito ainda</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Salve imóveis para comparar preço, localização e contato do anunciante sem precisar procurar de novo.
        </p>
      </div>
      <div>
        <Link
          href="/imoveis/buscar"
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 hover:no-underline"
        >
          <Search className="size-4" aria-hidden="true" />
          Explorar imóveis
        </Link>
      </div>
    </div>
  );
}
