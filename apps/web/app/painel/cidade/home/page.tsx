import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { requireRole } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { BLOCK_CATALOG, BLOCK_TYPES } from '@/lib/home';
import { getHomeLayoutForAdmin } from '@/lib/home/queries';
import { createHomeBlockAction } from '@/lib/home/actions';
import { LayoutSettings } from './layout-settings';
import { SortableBlockList, type SortableBlock } from './sortable-block-list';

export default async function HomeBuilderPage() {
  const city = await getCurrentCity();
  if (!city) return null;
  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });

  const { blocks, layoutConfig } = await getHomeLayoutForAdmin(city.id);

  const items: SortableBlock[] = blocks.map((block) => ({
    id: block.id,
    type: block.type,
    title: block.title,
    enabled: block.enabled,
    bannerCount:
      block.type === 'banner_carousel' ||
      block.type === 'wide_banner' ||
      block.type === 'custom_hero_banner'
        ? block.banners.length
        : null,
    groupWithNext: block.groupWithNext,
    groupTitle: block.groupTitle,
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Home de {city.name}</h1>
        <p className="text-muted-foreground text-sm">
          Arraste pra reordenar. Cada bloco pode ser ativado/desativado, editado ou removido.
        </p>
      </header>

      <LayoutSettings initial={layoutConfig} />

      <section className="rounded-2xl border bg-card p-5">
        <h2 className="text-lg font-semibold">Adicionar bloco</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Escolha o tipo. O bloco e criado com a configuracao padrao e voce edita depois.
        </p>
        <form action={createHomeBlockAction} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <div className="grid gap-1.5">
            <Label htmlFor="new-block-type">Tipo</Label>
            <select
              id="new-block-type"
              name="type"
              defaultValue="banner_carousel"
              className="border-ink-200 rounded-md border bg-white px-3 py-2 text-sm"
            >
              {BLOCK_TYPES.map((type) => (
                <option key={type} value={type}>
                  {BLOCK_CATALOG[type].label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="new-block-title">Titulo (opcional)</Label>
            <Input
              id="new-block-title"
              name="title"
              maxLength={120}
              placeholder="Ex: Ofertas da semana"
            />
          </div>
          <div className="flex items-end">
            <Button type="submit">Adicionar</Button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Blocos da home ({items.length})</h2>
        <SortableBlockList initial={items} />
      </section>
    </div>
  );
}
