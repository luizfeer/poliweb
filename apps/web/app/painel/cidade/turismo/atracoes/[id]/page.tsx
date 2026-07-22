import { Link } from '@/components/navigation/link';
import { GalleryUploadField, type GalleryMedia } from '@/components/admin/media/gallery-upload-field';
import { ImageUploadField } from '@/components/admin/media/image-upload-field';
import { AttractionEditForm } from '@/components/admin/tourism/attraction-edit-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getCurrentCity } from '@/lib/cities';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import {
  moderateAttractionPhotoAction,
  moderateAttractionReviewAction,
  replyAttractionReviewAction,
  upsertAttractionServiceAction,
} from '../actions';
import { GoogleAttractionImport } from './google-attraction-import';
import { DeleteAttractionButton } from './delete-attraction-button';

type PageProps = { params: Promise<{ id: string }> };

function publicTourismUrl(path: string) {
  if (path.startsWith('http')) return path;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/tourism/${path}`;
}

export default async function AttractionEditPage({ params }: PageProps) {
  const city = await getCurrentCity();
  if (!city) return null;
  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const { id } = await params;
  const supabase = await createClient();
  const [attractionResult, reviewsResult, photosResult, servicesResult, galleryResult] = await Promise.all([
    supabase.from('attractions').select('*').eq('id', id).eq('city_id', city.id).single(),
    supabase
      .from('attraction_reviews')
      .select('*')
      .eq('attraction_id', id)
      .eq('city_id', city.id)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('attraction_photos')
      .select('*')
      .eq('attraction_id', id)
      .eq('city_id', city.id)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase.from('attraction_services').select('*').eq('attraction_id', id).order('kind'),
    supabase
      .from('media_links')
      .select('asset_id, media_assets(cdn_url, content_type)')
      .eq('city_id', city.id)
      .eq('entity_type', 'attraction')
      .eq('entity_id', id)
      .eq('role', 'gallery')
      .order('position', { ascending: false }),
  ]);
  const attraction = attractionResult.data;
  if (!attraction) return null;
  const galleryMedia: GalleryMedia[] = (galleryResult.data ?? []).flatMap((link) => {
    const asset = link.media_assets as { cdn_url?: string | null; content_type?: string | null } | null;
    return asset?.cdn_url
      ? [{ assetId: link.asset_id, url: asset.cdn_url, contentType: asset.content_type }]
      : [];
  });

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-ink-100 bg-card p-4 shadow-card md:p-5">
        <div>
          <p className="text-muted-foreground text-sm">Atração</p>
          <h1 className="mt-1 text-2xl font-bold leading-tight md:text-3xl">{attraction.name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {attraction.slug} · {attraction.status}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-paper p-3">
          <Link
            className="inline-flex h-10 items-center justify-center rounded-lg bg-ink-900 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-800 hover:no-underline"
            href={`/turismo/o-que-fazer/${attraction.slug}`}
            prefetch={false}
            target="_blank"
            rel="noopener noreferrer"
          >
            Ver público
          </Link>
          <DeleteAttractionButton attractionId={attraction.id} attractionName={attraction.name} />
        </div>
      </header>

      <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <AttractionEditForm
          key={`${attraction.id}-${attraction.updated_at ?? ''}`}
          cityId={city.id}
          attraction={attraction as Record<string, unknown>}
        />

        <aside className="space-y-4 xl:sticky xl:top-4">
          <ImageUploadField
            entityType="attraction"
            entityId={attraction.id}
            role="cover"
            label="Capa"
            currentUrl={attraction.cover_url}
            revalidatePath={`/painel/cidade/turismo/atracoes/${attraction.id}`}
            helpText="Imagem principal da pagina publica."
            contextLabel={`Capa · ${attraction.name}`}
          />
          <GoogleAttractionImport attractionId={attraction.id} defaultQuery={attraction.name} />
          <form
            action={upsertAttractionServiceAction}
            className="grid gap-3 rounded-2xl border border-ink-100 bg-card p-4 shadow-card"
          >
            <input type="hidden" name="attraction_id" value={attraction.id} />
            <h2 className="font-semibold">Adicionar serviço</h2>
            <Input name="kind" placeholder="estacionamento, banheiro, guia..." required />
            <Input name="label" placeholder="Nome exibido" required />
            <Input name="price" placeholder="Preço" />
            <textarea
              name="details"
              rows={2}
              className="bg-background rounded-lg border px-3 py-2 text-sm"
              placeholder="Detalhes"
            />
            <Button type="submit" variant="secondary">
              Salvar serviço
            </Button>
          </form>
        </aside>
      </section>

      <GalleryUploadField
        entityType="attraction"
        entityId={attraction.id}
        media={galleryMedia}
        revalidatePath={`/painel/cidade/turismo/atracoes/${attraction.id}`}
        contextLabel={`Galeria · ${attraction.name}`}
      />

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-ink-100 bg-card p-4 shadow-card md:p-5">
          <h2 className="font-semibold">Serviços</h2>
          <div className="mt-3 grid gap-2">
            {(servicesResult.data ?? []).map((service) => (
              <form
                key={service.id}
                action={upsertAttractionServiceAction}
                className="grid gap-2 rounded-xl border border-ink-100 bg-paper/60 p-3 text-sm"
              >
                <input type="hidden" name="id" value={service.id} />
                <input type="hidden" name="attraction_id" value={attraction.id} />
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor={`service-kind-${service.id}`}>Tipo</Label>
                    <Input
                      id={`service-kind-${service.id}`}
                      name="kind"
                      defaultValue={service.kind}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`service-label-${service.id}`}>Nome exibido</Label>
                    <Input
                      id={`service-label-${service.id}`}
                      name="label"
                      defaultValue={service.label}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`service-details-${service.id}`}>Detalhes</Label>
                  <textarea
                    id={`service-details-${service.id}`}
                    name="details"
                    rows={2}
                    defaultValue={service.details ?? ''}
                    className="bg-card w-full rounded-lg border px-3 py-2 text-sm"
                  />
                </div>
                <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <div className="space-y-1">
                    <Label htmlFor={`service-price-${service.id}`}>Preço</Label>
                    <Input
                      id={`service-price-${service.id}`}
                      name="price"
                      defaultValue={service.price ?? ''}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button type="submit" size="sm" variant="secondary">
                      Salvar
                    </Button>
                  </div>
                </div>
              </form>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-ink-100 bg-card p-4 shadow-card md:p-5">
          <h2 className="font-semibold">Reviews</h2>
          <div className="mt-3 grid gap-3">
            {(reviewsResult.data ?? []).map((review) => (
              <article key={review.id} className="rounded-xl border border-ink-100 bg-paper/60 p-3 text-sm">
                <strong>
                  {review.rating}/5 · {review.title ?? 'Avaliação'}
                </strong>
                <p className="text-muted-foreground m-0">{review.comment}</p>
                <p className="text-muted-foreground m-0 text-xs">Status: {review.status}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(['published', 'rejected'] as const).map((status) => (
                    <form key={status} action={moderateAttractionReviewAction}>
                      <input type="hidden" name="review_id" value={review.id} />
                      <input type="hidden" name="attraction_id" value={attraction.id} />
                      <input type="hidden" name="status" value={status} />
                      <Button
                        type="submit"
                        size="sm"
                        variant={status === 'published' ? 'default' : 'secondary'}
                      >
                        {status === 'published' ? 'Aprovar' : 'Rejeitar'}
                      </Button>
                    </form>
                  ))}
                </div>
                <form action={replyAttractionReviewAction} className="mt-2 grid gap-2">
                  <input type="hidden" name="review_id" value={review.id} />
                  <input type="hidden" name="attraction_id" value={attraction.id} />
                  <Input
                    name="reply_owner"
                    defaultValue={review.reply_owner ?? ''}
                    placeholder="Resposta do owner"
                  />
                  <Button type="submit" size="sm" variant="secondary">
                    Responder
                  </Button>
                </form>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-ink-100 bg-card p-4 shadow-card md:p-5">
          <h2 className="font-semibold">Fotos UGC</h2>
          <div className="mt-3 grid gap-3">
            {(photosResult.data ?? []).map((photo) => (
              <article key={photo.id} className="rounded-xl border border-ink-100 bg-paper/60 p-3 text-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={publicTourismUrl(photo.storage_path)}
                  alt=""
                  className="h-32 w-full rounded-md object-cover"
                />
                <p className="text-muted-foreground mt-2">
                  {photo.caption ?? 'Sem legenda'} · {photo.status}
                </p>
                <div className="mt-2 flex gap-2">
                  {(['published', 'rejected'] as const).map((status) => (
                    <form key={status} action={moderateAttractionPhotoAction}>
                      <input type="hidden" name="photo_id" value={photo.id} />
                      <input type="hidden" name="attraction_id" value={attraction.id} />
                      <input type="hidden" name="status" value={status} />
                      <Button
                        type="submit"
                        size="sm"
                        variant={status === 'published' ? 'default' : 'secondary'}
                      >
                        {status === 'published' ? 'Aprovar' : 'Rejeitar'}
                      </Button>
                    </form>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
