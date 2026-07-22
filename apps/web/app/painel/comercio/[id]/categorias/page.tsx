import { Link } from '@/components/navigation/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { getCurrentCity } from '@/lib/cities';
import { hasRole, requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { updateBusinessCategoriesAction } from '../../actions';
import { BusinessTabs } from '../business-tabs';

type PageProps = {
  params: Promise<{ id: string }>;
};

type CategoryAssignment = {
  category_id: string;
  is_primary: boolean | null;
};

export default async function BusinessCategoriesPage({ params }: PageProps) {
  const [{ id }, city] = await Promise.all([params, getCurrentCity()]);
  if (!city) return null;

  const auth = await requireRole({ cityId: city.id, kinds: ['merchant', 'city_admin', 'super_admin'] });
  const supabase = await createClient();
  const canManageAll = hasRole(auth.roles, ['city_admin', 'super_admin'], city.id);

  const [{ data: business }, { data: categories }] = await Promise.all([
    supabase
      .from('businesses')
      .select('id, name, owner_profile_id, business_category_assignments(category_id, is_primary)')
      .eq('id', id)
      .eq('city_id', city.id)
      .single(),
    supabase
      .from('business_categories')
      .select('id, name, slug, parent_id, display_order')
      .or(`city_id.is.null,city_id.eq.${city.id}`)
      .eq('active', true)
      .order('display_order'),
  ]);

  if (!business) notFound();

  if (!canManageAll && business.owner_profile_id !== auth.profile.id) {
    const { data: manager } = await supabase
      .from('entity_managers')
      .select('id')
      .eq('profile_id', auth.profile.id)
      .eq('entity_type', 'business')
      .eq('entity_id', business.id)
      .maybeSingle();
    if (!manager) notFound();
  }

  const assignments = (business.business_category_assignments ?? []) as CategoryAssignment[];
  const selectedCategoryIds = new Set(assignments.map((assignment) => assignment.category_id));
  const primaryCategoryId = assignments.find((assignment) => assignment.is_primary)?.category_id;

  return (
    <div className="space-y-5">
      <header className="rounded-xl border border-ink-100 bg-card p-4 shadow-card md:p-5">
        <Link
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-clay-700 hover:no-underline"
          href={`/painel/comercio/${business.id}`}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar para ficha
        </Link>
        <h1 className="mt-3 text-2xl font-bold leading-tight md:text-3xl">Categorias</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Marque as categorias e selecione a principal de {business.name}.
        </p>
      </header>

      <BusinessTabs businessId={business.id} active="categorias" />

      <form
        action={updateBusinessCategoriesAction}
        className="grid gap-4 rounded-xl border border-ink-100 bg-card p-4 shadow-card md:p-5"
      >
        <input type="hidden" name="business_id" value={business.id} />
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {(categories ?? []).map((category) => (
            <label
              key={category.id}
              className="flex min-h-11 items-center gap-2 rounded-lg border border-ink-100 px-3 py-2 text-sm hover:bg-clay-50"
            >
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
        <p className="text-xs text-muted-foreground">
          Marque a categoria e selecione o círculo como principal.
        </p>
        <div>
          <button className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-clay-600" type="submit">
            <Save className="size-4" aria-hidden="true" />
            Salvar categorias
          </button>
        </div>
      </form>
    </div>
  );
}
