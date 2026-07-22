import { Link } from '@/components/navigation/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  Camera,
  ChevronRight,
  ExternalLink,
  Globe2,
  CreditCard,
  Link2,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  Save,
  Sparkles,
  Store,
  Truck,
  type LucideIcon,
} from 'lucide-react';
import { getCurrentCity } from '@/lib/cities';
import { hasRole, requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { ImageUploadField } from '@/components/admin/media/image-upload-field';
import { GalleryUploadField, type GalleryMedia, type LegacyGalleryMedia } from '@/components/admin/media/gallery-upload-field';
import { setBusinessStatusAction, upsertBusinessAction } from '../actions';
import { DeleteBusinessButton } from '../delete-business-button';
import { ConvertBusinessToAttractionForm } from '@/components/admin/tourism/convert-business-form';
import { GoogleBusinessImport } from './google-business-import';
import { BusinessTabs } from './business-tabs';

type PageProps = {
  params: Promise<{ id: string }>;
};

type BusinessCategoryAssignment = {
  category_id: string;
  is_primary: boolean | null;
};

type BusinessStatus = 'draft' | 'pending' | 'published' | 'archived';

const STATUS_LABELS: Record<BusinessStatus, string> = {
  draft: 'Rascunho',
  pending: 'Em revisão',
  published: 'Publicado',
  archived: 'Arquivado',
};

const ALL_STATUS_OPTIONS: Array<{ value: BusinessStatus; label: string }> = [
  { value: 'draft', label: 'Rascunho' },
  { value: 'pending', label: 'Em revisão' },
  { value: 'published', label: 'Publicado' },
  { value: 'archived', label: 'Arquivado' },
];

const MERCHANT_STATUS_OPTIONS: Array<{ value: BusinessStatus; label: string }> = [
  { value: 'draft', label: 'Rascunho' },
  { value: 'pending', label: 'Solicitar publicação' },
];

const AMENITY_OPTIONS = [
  { value: 'delivery', label: 'Delivery' },
  { value: 'retira_no_local', label: 'Retirada no local' },
  { value: 'estacionamento', label: 'Estacionamento' },
  { value: 'wifi', label: 'Wi-Fi' },
  { value: 'acessivel', label: 'Acessível' },
  { value: 'ar_condicionado', label: 'Ar-condicionado' },
  { value: 'aceita_pet', label: 'Aceita pet' },
  { value: 'area_infantil', label: 'Área infantil' },
  { value: 'reserva', label: 'Aceita reserva' },
  { value: 'nota_fiscal', label: 'Emite nota fiscal' },
];

const PAYMENT_OPTIONS = [
  { value: 'pix', label: 'Pix' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'debito', label: 'Cartão de débito' },
  { value: 'credito', label: 'Cartão de crédito' },
  { value: 'vale_refeicao', label: 'Vale-refeição' },
  { value: 'vale_alimentacao', label: 'Vale-alimentação' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'transferencia', label: 'Transferência' },
];

export default async function EditBusinessPage({ params }: PageProps) {
  const [{ id }, city] = await Promise.all([params, getCurrentCity()]);
  if (!city) return null;

  const auth = await requireRole({ cityId: city.id, kinds: ['merchant', 'city_admin', 'super_admin'] });
  const supabase = await createClient();
  const isNew = id === 'novo';
  const canManageAll = hasRole(auth.roles, ['city_admin', 'super_admin'], city.id);
  const [{ data: business }, { data: categories }, { data: districts }, { data: galleryLinks }] = await Promise.all([
    isNew
      ? Promise.resolve({ data: null })
      : supabase
          .from('businesses')
          .select('*, business_category_assignments(category_id, is_primary)')
          .eq('id', id)
          .eq('city_id', city.id)
          .single(),
    supabase
      .from('business_categories')
      .select('id, name, slug, parent_id, display_order')
      .or(`city_id.is.null,city_id.eq.${city.id}`)
      .eq('active', true)
      .order('display_order'),
    supabase.from('districts').select('id, name').eq('city_id', city.id).order('display_order'),
    isNew
      ? Promise.resolve({ data: null })
      : supabase
          .from('media_links')
          .select('asset_id, media_assets(cdn_url, content_type)')
          .eq('city_id', city.id)
          .eq('entity_type', 'business')
          .eq('entity_id', id)
          .eq('role', 'gallery')
          .order('position', { ascending: false }),
  ]);

  const assignments = (business?.business_category_assignments ?? []) as BusinessCategoryAssignment[];
  const selectedCategoryIds = new Set(assignments.map((assignment) => assignment.category_id));
  const primaryCategoryId = assignments.find((assignment) => assignment.is_primary)?.category_id;

  if (!isNew && !business) {
    notFound();
  }

  if (!isNew && business && !canManageAll && business.owner_profile_id !== auth.profile.id) {
    const { data: manager } = await supabase
      .from('entity_managers')
      .select('id')
      .eq('profile_id', auth.profile.id)
      .eq('entity_type', 'business')
      .eq('entity_id', business.id)
      .maybeSingle();

    if (!manager) {
      notFound();
    }
  }

  const galleryMedia: GalleryMedia[] = (galleryLinks ?? []).flatMap((link) => {
    const asset = link.media_assets as { cdn_url?: string | null; content_type?: string | null } | null;
    return asset?.cdn_url
      ? [{ assetId: link.asset_id, url: asset.cdn_url, contentType: asset.content_type }]
      : [];
  });
  const linkedGalleryUrls = new Set(galleryMedia.map((item) => item.url));
  const legacyGalleryMedia: LegacyGalleryMedia[] = asStringArray(business?.photos)
    .reverse()
    .filter((url) => !linkedGalleryUrls.has(url))
    .map((url) => ({ url }));
  const photosCount = galleryMedia.length + legacyGalleryMedia.length;
  const publicHref = business?.slug ? `/comercio/negocio/${business.slug}` : '/comercio';
  const selectedAmenities = asStringArray(business?.amenities);
  const selectedPayments = asStringArray(business?.payment_methods);
  const hasOrderingConfig = hasOrderingDraft(business?.import_source);

  return (
    <div className="space-y-5">
      <header className="overflow-hidden rounded-2xl border border-ink-100 bg-card shadow-card">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 p-4 md:p-6">
            <Link
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-clay-700 hover:no-underline"
              href="/painel/comercio"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Voltar para comércio
            </Link>
            <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-paper p-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-clay-50 px-2.5 py-1 text-xs font-semibold text-clay-700">
                <Store className="size-3.5" aria-hidden="true" />
                {STATUS_LABELS[business?.status as BusinessStatus] ?? 'Rascunho'}
              </span>
              {business?.verified ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-cerrado-100 px-2.5 py-1 text-xs font-semibold text-cerrado-700">
                  <BadgeCheck className="size-3.5" aria-hidden="true" />
                  Verificado
                </span>
              ) : null}
              {!isNew && business && (
                <form action={setBusinessStatusAction} className="inline-flex items-center gap-1.5">
                  <input type="hidden" name="business_id" value={business.id} />
                  <label className="sr-only" htmlFor="quick-status">Status</label>
                  <select
                    id="quick-status"
                    name="status"
                    defaultValue={business.status ?? 'draft'}
                    className="min-w-0 rounded-lg border border-ink-200 bg-white px-2 py-1 text-xs font-medium"
                  >
                    {(canManageAll ? ALL_STATUS_OPTIONS : MERCHANT_STATUS_OPTIONS).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="inline-flex min-h-7 items-center gap-1 rounded-lg bg-ink-900 px-2.5 py-1 text-xs font-semibold text-white hover:bg-ink-800"
                  >
                    Atualizar
                  </button>
                </form>
              )}
            </div>
            <h1 className="mt-4 max-w-4xl text-2xl font-bold leading-tight md:text-3xl">
              {isNew ? 'Nova ficha de comércio' : business?.name}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Edite a ficha pública, fotos, contato e pedidos em um só lugar.
            </p>
            {!isNew && business ? (
              <div className="mt-5 grid gap-3 border-t border-ink-100 pt-4 sm:grid-cols-2 xl:grid-cols-4">
                <Link
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-ink-900 px-3 py-2 text-sm font-semibold text-white hover:bg-ink-800 hover:no-underline"
                  href={publicHref}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="size-4" aria-hidden="true" />
                  Ver ficha pública
                </Link>
                <Link
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-ink-100 bg-white px-3 py-2 text-sm font-semibold text-ink-800 hover:bg-clay-50 hover:no-underline"
                  href={`/painel/comercio/${business.id}/pedidos`}
                >
                  <Truck className="size-4" aria-hidden="true" />
                  Configurar pedidos
                </Link>
                <Link
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-ink-100 bg-white px-3 py-2 text-sm font-semibold text-ink-800 hover:bg-clay-50 hover:no-underline"
                  href={`/painel/comercio/${business.id}/novidades`}
                >
                  <Sparkles className="size-4" aria-hidden="true" />
                  Novidades
                </Link>
                {canManageAll && <ConvertBusinessToAttractionForm businessId={business.id} variant="modal" />}
                <DeleteBusinessButton businessId={business.id} businessName={business.name} />
              </div>
            ) : null}
          </div>

          <div className="grid gap-3 border-t border-ink-100 bg-paper p-4 md:p-5 lg:border-l lg:border-t-0">
            <div
              className="min-h-36 rounded-xl bg-cover bg-center"
              style={business?.cover_url ? { backgroundImage: `url(${business.cover_url})` } : undefined}
            >
              {!business?.cover_url ? (
                <div className="flex h-36 items-center justify-center rounded-xl border border-dashed border-ink-200 text-xs font-medium text-muted-foreground">
                  Sem capa
                </div>
              ) : null}
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <Metric label="Fotos" value={photosCount} />
              <Metric label="Pedidos" value={business?.ordering_enabled ? 'On' : hasOrderingConfig ? 'Config.' : 'Off'} />
              <Metric label="Plano" value={business?.plan ?? 'base'} />
            </div>
            {!isNew && business && (
              <div className="rounded-xl border border-ink-100 bg-white p-3 text-sm">
                <p className="font-semibold">Publicação</p>
                <p className="mt-1 text-xs text-muted-foreground">Atualize o status no seletor do topo. A ficha pública só muda depois de salvar.</p>
              </div>
            )}
          </div>
        </div>
      </header>

      {!isNew && business && <BusinessTabs businessId={business.id} active="dados" />}

      {!isNew && business && (
        <nav className="grid gap-3 sm:grid-cols-3">
          <QuickAction
            href="#business-form"
            icon={<Pencil className="size-5" />}
            title="Editar dados"
            description="Nome, descrição, contatos, horários, categorias."
            accent="bg-clay-50 text-clay-700 ring-clay-200"
          />
          <QuickAction
            href="#fotos-ficha"
            icon={<Camera className="size-5" />}
            title="Capa, logo e galeria"
            description="Imagens públicas da ficha."
            accent="bg-cerrado-50 text-cerrado-700 ring-cerrado-200"
          />
          <QuickAction
            href={`/painel/comercio/${business.id}/novidades`}
            icon={<Sparkles className="size-5" />}
            title="Publicar novidade"
            description="Avisos, promoções e atualizações."
            accent="bg-sun-50 text-ink-900 ring-sun-300"
          />
        </nav>
      )}

      {!isNew && business && (
        <section className="grid gap-4 rounded-xl border border-ink-100 bg-card p-4 shadow-card md:grid-cols-[minmax(0,1fr)_minmax(260px,340px)]">
          <div>
            <SectionTitle
              icon={Sparkles}
              title="Completar ficha"
              description="Busque dados do Google e salve links de referência. A aprovação continua manual."
            />
            <div className="mt-4">
              <GoogleBusinessImport
                businessId={business.id}
                defaultQuery={`${business.name}${business.address ? ` ${business.address}` : ''}`}
              />
            </div>
          </div>
          <div className="grid gap-3 rounded-xl bg-paper p-3">
            <p className="text-sm font-semibold">Fontes da ficha</p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Links salvos ajudam na revisão e nas próximas importações.
            </p>
            <div className="grid gap-2">
              <input
                className="min-w-0 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm"
                defaultValue={business.google_maps_url ?? ''}
                form="business-form"
                name="google_maps_url"
                placeholder="Link do Google Maps"
              />
              <input
                className="min-w-0 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm"
                defaultValue={business.instagram ?? ''}
                form="business-form"
                name="instagram"
                placeholder="@instagram ou URL"
              />
              <input
                className="min-w-0 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm"
                defaultValue={business.facebook ?? ''}
                form="business-form"
                name="facebook"
                placeholder="Facebook"
              />
            </div>
          </div>
        </section>
      )}

      {!isNew && business && (
        <section id="fotos-ficha" className="space-y-4 scroll-mt-24 rounded-2xl border border-ink-100 bg-card p-4 shadow-card md:p-5">
          <SectionTitle icon={Camera} title="Fotos da ficha" description="Capa, logo e galeria em blocos separados." />
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_280px]">
            <ImageUploadField
              entityType="business"
              entityId={business.id}
              role="cover"
              label="Capa"
              currentUrl={business.cover_url}
              revalidatePath={`/painel/comercio/${business.id}`}
              helpText="Imagem principal da ficha e das listagens."
              contextLabel={`Capa · ${business.name}`}
            />
            <ImageUploadField
              entityType="business"
              entityId={business.id}
              role="logo"
              label="Logo"
              currentUrl={business.logo_url}
              revalidatePath={`/painel/comercio/${business.id}`}
              helpText="Marca do negócio."
              contextLabel={`Logo · ${business.name}`}
            />
          </div>
          <GalleryUploadField
            entityType="business"
            entityId={business.id}
            media={galleryMedia}
            legacyMedia={legacyGalleryMedia}
            revalidatePath={`/painel/comercio/${business.id}`}
            contextLabel={`Galeria · ${business.name}`}
          />
        </section>
      )}

      <form id="business-form" action={upsertBusinessAction} className="grid gap-4 scroll-mt-24 rounded-2xl border border-ink-100 bg-card p-4 shadow-card md:grid-cols-2 md:p-5">
        {business?.id && <input type="hidden" name="id" value={business.id} />}
        <input type="hidden" name="city_id" value={city.id} />
        <input type="hidden" name="hours" value={JSON.stringify(business?.hours ?? {})} />
        {!business && (
          <>
            <input type="hidden" name="facebook" value="" />
            <input type="hidden" name="google_maps_url" value="" />
            <input type="hidden" name="instagram" value="" />
          </>
        )}

        <div className="md:col-span-2">
          <SectionTitle icon={Building2} title="Dados principais" description="Nome, descrição e informações públicas do comércio." />
        </div>

        <Field label="Nome" icon={Store}>
          <input className="min-w-0 rounded-lg border border-ink-200 px-3 py-2" name="name" defaultValue={business?.name ?? ''} required />
        </Field>
        <Field label="Slug" icon={Link2}>
          <input className="min-w-0 rounded-lg border border-ink-200 px-3 py-2" name="slug" defaultValue={business?.slug ?? ''} required />
        </Field>
        <Field label="Descrição curta" icon={MessageCircle} className="md:col-span-2">
          <input
            className="min-w-0 rounded-lg border border-ink-200 px-3 py-2"
            name="short_description"
            defaultValue={business?.short_description ?? ''}
            maxLength={160}
          />
        </Field>
        <Field label="Descrição" icon={MessageCircle} className="md:col-span-2">
          <textarea
            className="min-h-32 min-w-0 rounded-lg border border-ink-200 px-3 py-2"
            name="description"
            defaultValue={business?.description ?? ''}
          />
        </Field>
        <Field label="Status" icon={Store}>
          <select
            className="min-w-0 rounded-lg border border-ink-200 px-3 py-2"
            name="status"
            defaultValue={business?.status ?? 'draft'}
          >
            {(canManageAll ? ALL_STATUS_OPTIONS : MERCHANT_STATUS_OPTIONS).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Distrito" icon={MapPin}>
          <select className="min-w-0 rounded-lg border border-ink-200 px-3 py-2" name="district_id" defaultValue={business?.district_id ?? ''}>
            <option value="">Sem distrito</option>
            {(districts ?? []).map((district) => (
              <option key={district.id} value={district.id}>
                {district.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="CNPJ" icon={BadgeCheck}>
          <input className="min-w-0 rounded-lg border border-ink-200 px-3 py-2" name="cnpj" defaultValue={business?.cnpj ?? ''} />
        </Field>
        <Field label="Telefone" icon={Phone}>
          <input className="min-w-0 rounded-lg border border-ink-200 px-3 py-2" name="phone" defaultValue={business?.phone ?? ''} />
        </Field>
        <Field label="WhatsApp" icon={MessageCircle}>
          <input className="min-w-0 rounded-lg border border-ink-200 px-3 py-2" name="whatsapp" defaultValue={business?.whatsapp ?? ''} />
        </Field>
        <Field label="Email" icon={MessageCircle}>
          <input className="min-w-0 rounded-lg border border-ink-200 px-3 py-2" name="email" defaultValue={business?.email ?? ''} />
        </Field>
        <Field label="Site" icon={Globe2}>
          <input className="min-w-0 rounded-lg border border-ink-200 px-3 py-2" name="website" defaultValue={business?.website ?? ''} />
        </Field>
        <Field label="Endereço" icon={MapPin} className="md:col-span-2">
          <input className="min-w-0 rounded-lg border border-ink-200 px-3 py-2" name="address" defaultValue={business?.address ?? ''} />
        </Field>
        <Field label="CEP" icon={MapPin}>
          <input className="min-w-0 rounded-lg border border-ink-200 px-3 py-2" name="cep" defaultValue={business?.cep ?? ''} />
        </Field>
        <Field label="Latitude" icon={MapPin}>
          <input className="min-w-0 rounded-lg border border-ink-200 px-3 py-2" name="lat" defaultValue={business?.lat ?? ''} />
        </Field>
        <Field label="Longitude" icon={MapPin}>
          <input className="min-w-0 rounded-lg border border-ink-200 px-3 py-2" name="lng" defaultValue={business?.lng ?? ''} />
        </Field>
        <CheckboxGrid
          className="md:col-span-2"
          icon={Sparkles}
          label="Comodidades"
          name="amenities"
          options={AMENITY_OPTIONS}
          selected={selectedAmenities}
        />
        <CheckboxGrid
          className="md:col-span-2"
          icon={CreditCard}
          label="Pagamentos"
          name="payment_methods"
          options={PAYMENT_OPTIONS}
          selected={selectedPayments}
        />

        {isNew && (
          <fieldset className="grid gap-3 rounded-xl border border-ink-100 p-4 md:col-span-2">
            <legend className="px-1 text-sm font-semibold">Categorias</legend>
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {(categories ?? []).map((category) => (
                <label key={category.id} className="flex min-h-11 items-center gap-2 rounded-lg border border-ink-100 px-3 py-2 text-sm hover:bg-clay-50">
                  <input
                    type="checkbox"
                    name="category_ids"
                    value={category.id}
                    defaultChecked={selectedCategoryIds.has(category.id)}
                  />
                  <input
                    type="radio"
                    name="primary_category_id"
                    value={category.id}
                    defaultChecked={primaryCategoryId === category.id || (!primaryCategoryId && selectedCategoryIds.has(category.id))}
                    required
                  />
                  {category.name}
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Marque a categoria e selecione o círculo como principal.</p>
          </fieldset>
        )}

        <div className="md:col-span-2">
          <button className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-clay-600" type="submit">
            <Save className="size-4" aria-hidden="true" />
            Salvar ficha
          </button>
        </div>
      </form>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-white px-2 py-2">
      <p className="truncate text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate text-sm font-bold text-foreground">{value}</p>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-clay-50 text-clay-700">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  title,
  description,
  accent,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-ink-100 bg-card p-3 text-left shadow-sm transition-colors hover:border-primary/40 hover:bg-clay-50/40 hover:no-underline"
    >
      <span className={`inline-flex size-10 shrink-0 items-center justify-center rounded-lg ring-1 ${accent}`}>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-extrabold text-ink-900">{title}</p>
        <p className="mt-0.5 truncate text-xs text-ink-700">{description}</p>
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function Field({
  label,
  icon: Icon,
  className = '',
  children,
}: {
  label: string;
  icon: LucideIcon;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`grid min-w-0 gap-2 text-sm font-medium ${className}`}>
      <span className="flex items-center gap-2">
        <Icon className="size-4 text-clay-700" aria-hidden="true" />
        {label}
      </span>
      {children}
    </label>
  );
}

function CheckboxGrid({
  label,
  icon: Icon,
  name,
  options,
  selected,
  className = '',
}: {
  label: string;
  icon: LucideIcon;
  name: string;
  options: Array<{ value: string; label: string }>;
  selected: string[];
  className?: string;
}) {
  const selectedSet = new Set(selected);

  return (
    <fieldset className={`grid min-w-0 gap-3 rounded-xl border border-ink-100 p-4 ${className}`}>
      <legend className="px-1 text-sm font-semibold">
        <span className="inline-flex items-center gap-2">
          <Icon className="size-4 text-clay-700" aria-hidden="true" />
          {label}
        </span>
      </legend>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex min-h-11 items-center gap-2 rounded-lg border border-ink-100 px-3 py-2 text-sm hover:bg-clay-50"
          >
            <input
              type="checkbox"
              name={name}
              value={option.value}
              defaultChecked={selectedSet.has(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function hasOrderingDraft(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const draft = (value as { panel_draft?: unknown }).panel_draft;
  if (!draft || typeof draft !== 'object' || Array.isArray(draft)) return false;
  const offerings = (draft as { offerings?: unknown }).offerings;
  if (!Array.isArray(offerings)) return false;
  return offerings.some((offering) => {
    if (!offering || typeof offering !== 'object') return false;
    const name = (offering as { name?: unknown }).name;
    return typeof name === 'string' && name.trim().length > 0;
  });
}
