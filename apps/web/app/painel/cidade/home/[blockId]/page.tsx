import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { requireRole } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { BLOCK_CATALOG } from '@/lib/home';
import { getHomeLayoutForAdmin } from '@/lib/home/queries';
import { BannerForm } from './banner-form';
import { BlockConfigEditor } from './block-config-editor';
import { SortableBannerList } from './sortable-banner-list';

export default async function HomeBlockEditorPage({
  params,
}: {
  params: Promise<{ blockId: string }>;
}) {
  const city = await getCurrentCity();
  if (!city) return null;
  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });

  const { blockId } = await params;
  const { blocks } = await getHomeLayoutForAdmin(city.id);
  const block = blocks.find((b) => b.id === blockId);
  if (!block) notFound();

  const meta = BLOCK_CATALOG[block.type];
  const hasBanners =
    block.type === 'banner_carousel' ||
    block.type === 'wide_banner' ||
    block.type === 'custom_hero_banner';
  const singleMode = block.type === 'wide_banner' || block.type === 'custom_hero_banner';
  const canAddBanner = !singleMode || block.banners.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/painel/cidade/home"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </Link>
      </div>

      <header>
        <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
          {meta.label}
        </p>
        <h1 className="text-2xl font-bold">{block.title ?? meta.label}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{meta.description}</p>
      </header>

      <section className="rounded-2xl border bg-card p-5">
        <h2 className="text-lg font-semibold">Configuracao</h2>
        <div className="mt-3">
          <BlockConfigEditor block={block} />
        </div>
      </section>

      {hasBanners ? (
        <section className="rounded-2xl border bg-card p-5">
          <header className="mb-3">
            <h2 className="text-lg font-semibold">
              {singleMode ? 'Banner' : `Banners (${block.banners.length})`}
            </h2>
            <p className="text-muted-foreground text-sm">
              {singleMode
                ? 'Banner unico. So 1 ativo por vez. Remova o atual para subir outra imagem.'
                : 'Cada banner precisa de uma imagem. O video e opcional: quando definido, toca uma vez ao entrar na tela e depois volta pra imagem.'}
            </p>
          </header>

          <div className="mb-5">
            <SortableBannerList
              blockId={block.id}
              initial={block.banners}
              singleMode={singleMode}
            />
          </div>

          {canAddBanner ? (
            <div className="border-t pt-5">
              <h3 className="text-sm font-semibold">
                {singleMode ? 'Definir imagem do banner' : 'Adicionar banner'}
              </h3>
              <BannerForm blockId={block.id} />
            </div>
          ) : (
            <p className="text-muted-foreground border-t pt-5 text-sm">
              Esse bloco usa imagem unica. Remova a atual pra subir outra.
            </p>
          )}
        </section>
      ) : null}
    </div>
  );
}
