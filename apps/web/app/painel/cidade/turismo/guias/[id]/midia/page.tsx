import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@/components/navigation/link';
import { GalleryUploadField, type GalleryMedia } from '@/components/admin/media/gallery-upload-field';
import { ImageUploadField } from '@/components/admin/media/image-upload-field';
import { GoogleGuideImport } from '@/components/admin/tourism/google-guide-import';
import { requireRole } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { createClient } from '@/lib/supabase/server';

type PageProps = { params: Promise<{ id: string }> };

export const metadata = { title: 'Mídia do guia turístico' };

export default async function GuideMediaPage({ params }: PageProps) {
  const city = await getCurrentCity();
  if (!city) return null;
  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });

  const { id } = await params;
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  const { data: guide, error: guideError } = await sb
    .from('tourism_guides')
    .select('id, name, cover_url, updated_at')
    .eq('id', id)
    .eq('city_id', city.id)
    .maybeSingle();
  if (guideError || !guide) notFound();

  const { data: galleryLinks } = await supabase
    .from('media_links')
    .select('asset_id, media_assets(cdn_url, content_type)')
    .eq('city_id', city.id)
    .eq('entity_type', 'tourism_guide')
    .eq('entity_id', id)
    .eq('role', 'gallery')
    .order('position', { ascending: false });

  const galleryMedia: GalleryMedia[] = (galleryLinks ?? []).flatMap((link) => {
    const asset = link.media_assets as { cdn_url?: string | null; content_type?: string | null } | null;
    return asset?.cdn_url
      ? [{ assetId: link.asset_id, url: asset.cdn_url, contentType: asset.content_type }]
      : [];
  });

  const row = guide as Record<string, unknown>;
  const name = String(row.name ?? 'Guia');

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Link
          href={`/painel/cidade/turismo/guias/${id}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Voltar para o guia
        </Link>
        <h1 className="text-3xl font-bold">Mídia · {name}</h1>
        <p className="text-sm text-muted-foreground">
          Capa, galeria CDN e importação de fotos do Google.
        </p>
      </header>

      <section className="grid gap-4">
        <GoogleGuideImport guideId={String(row.id)} defaultQuery={name} />
        <ImageUploadField
          entityType="tourism_guide"
          entityId={String(row.id)}
          role="cover"
          label="Capa"
          currentUrl={row.cover_url ? String(row.cover_url) : undefined}
          revalidatePath={`/painel/cidade/turismo/guias/${row.id}`}
          helpText="Imagem principal da página pública."
          contextLabel={`Capa · ${name}`}
        />
        <GalleryUploadField
          entityType="tourism_guide"
          entityId={String(row.id)}
          media={galleryMedia}
          revalidatePath={`/painel/cidade/turismo/guias/${row.id}`}
          title="Galeria (CDN)"
          helpText="Fotos servidas pela CDN; aparecem junto das fotos Google na página pública."
          contextLabel={`Galeria · ${name}`}
        />
      </section>
    </div>
  );
}
