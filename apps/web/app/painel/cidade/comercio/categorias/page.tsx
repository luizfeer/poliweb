import { Link } from '@/components/navigation/link';
import { ArrowLeft, CheckCircle2, CircleOff, Store } from 'lucide-react';
import { getCurrentCity } from '@/lib/cities';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { BusinessCategoryIcon } from '@/lib/businesses/icon-map';
import { categoryIconNames } from '@/lib/businesses';
import { upsertCategoryAction } from '../actions';
import { IconPicker } from './icon-picker';

type CategoryRow = {
  id: string;
  city_id: string | null;
  slug: string;
  name: string;
  parent_id: string | null;
  icon: string | null;
  display_order: number | null;
  active: boolean | null;
};

export default async function BusinessCategoriesPage() {
  const city = await getCurrentCity();
  if (!city) return null;

  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const supabase = await createClient();
  const { data } = await supabase
    .from('business_categories')
    .select('id, city_id, slug, name, parent_id, icon, display_order, active')
    .or(`city_id.is.null,city_id.eq.${city.id}`)
    .order('display_order')
    .order('name');

  const categories = (data ?? []) as CategoryRow[];
  const activeCount = categories.filter((category) => category.active !== false).length;
  const localCount = categories.filter((category) => category.city_id).length;

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border bg-card p-5 md:p-6">
        <Link
          href="/painel/cidade/comercio"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar ao comércio
        </Link>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Admin da cidade</p>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Categorias de comércio</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Edite nome, slug, ícone, hierarquia, ordem e visibilidade das categorias usadas no guia comercial.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center sm:w-auto">
            <Metric label="Total" value={categories.length} />
            <Metric label="Ativas" value={activeCount} />
            <Metric label="Locais" value={localCount} />
          </div>
        </div>
      </header>

      <section className="rounded-2xl border bg-card p-4 md:p-5">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Store className="size-4" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-semibold">Nova categoria</h2>
            <p className="text-sm text-muted-foreground">Crie uma categoria raiz ou filha para {city.name}.</p>
          </div>
        </div>
        <CategoryForm categories={categories} />
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold">Categorias cadastradas</h2>
          <p className="text-sm text-muted-foreground">Cada card salva a própria categoria.</p>
        </div>

        <div className="grid gap-3 xl:grid-cols-2">
          {categories.map((category) => (
            <article key={category.id} className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="mb-4 flex min-w-0 items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-primary">
                  <BusinessCategoryIcon name={category.icon ?? undefined} className="size-5" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate font-semibold">{category.name}</h3>
                    <StatusPill active={category.active !== false} />
                  </div>
                  <p className="mt-1 break-all text-xs text-muted-foreground">
                    {category.slug} · {category.city_id ? 'local' : 'global'} · ordem {category.display_order ?? 0}
                  </p>
                </div>
              </div>
              <CategoryForm category={category} categories={categories} />
            </article>
          ))}
        </div>
      </section>

    </div>
  );
}

function CategoryForm({
  category,
  categories,
}: {
  category?: CategoryRow;
  categories: CategoryRow[];
}) {
  const isGlobal = category ? !category.city_id : false;
  const parentOptions = categories.filter((item) => item.id !== category?.id);

  return (
    <form action={upsertCategoryAction} className="grid gap-3 md:grid-cols-6">
      {category ? <input type="hidden" name="id" value={category.id} /> : null}

      <label className="grid gap-1.5 text-sm font-medium md:col-span-2">
        Nome
        <input className="h-10 rounded-lg border bg-background px-3 text-sm" name="name" defaultValue={category?.name ?? ''} required />
      </label>

      <label className="grid gap-1.5 text-sm font-medium md:col-span-2">
        Slug
        <input className="h-10 rounded-lg border bg-background px-3 text-sm" name="slug" defaultValue={category?.slug ?? ''} required />
      </label>

      <div className="grid gap-1.5 text-sm font-medium md:col-span-2">
        Ícone
        <IconPicker defaultValue={category?.icon} icons={categoryIconNames} />
      </div>

      <label className="grid gap-1.5 text-sm font-medium md:col-span-3">
        Categoria pai
        <select className="h-10 rounded-lg border bg-background px-3 text-sm" name="parent_id" defaultValue={category?.parent_id ?? ''}>
          <option value="">Raiz</option>
          {parentOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1.5 text-sm font-medium md:col-span-1">
        Ordem
        <input
          className="h-10 rounded-lg border bg-background px-3 text-sm"
          name="display_order"
          type="number"
          defaultValue={category?.display_order ?? 0}
        />
      </label>

      <div className="grid gap-2 rounded-lg border bg-muted/30 p-3 md:col-span-2">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input name="active" type="checkbox" defaultChecked={category?.active !== false} />
          Ativa
        </label>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input name="scope" type="checkbox" value="global" defaultChecked={isGlobal} />
          Global
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2 md:col-span-6">
        <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" type="submit">
          {category ? 'Salvar categoria' : 'Adicionar categoria'}
        </button>
        {category ? (
          <span className="text-xs text-muted-foreground">
            Alterações aparecem no guia público depois de salvar.
          </span>
        ) : null}
      </div>
    </form>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-background px-4 py-3">
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={
        active
          ? 'inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700'
          : 'inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground'
      }
    >
      {active ? <CheckCircle2 className="size-3" aria-hidden="true" /> : <CircleOff className="size-3" aria-hidden="true" />}
      {active ? 'Ativa' : 'Inativa'}
    </span>
  );
}
