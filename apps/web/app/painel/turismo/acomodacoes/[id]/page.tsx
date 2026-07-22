import { AccommodationForm } from '@/components/admin/tourism/accommodation-form';
import { SeoSuggestionDialog } from '@/components/admin/tourism/seo-suggestion-dialog';
import { ImageUploadField } from '@/components/admin/media/image-upload-field';
import { getCurrentCity } from '@/lib/cities';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { generateSeoCopyAction, upsertAccommodationAction } from '../actions';

type PageProps = { params: Promise<{ id: string }> };

export default async function AccommodationEditPage({ params }: PageProps) {
  const city = await getCurrentCity();
  if (!city) return null;
  await requireRole({ cityId: city.id, kinds: ['merchant', 'city_admin', 'super_admin'] });
  const { id } = await params;
  const supabase = await createClient();
  const { data: districts } = await supabase.from('districts').select('id, name').eq('city_id', city.id).order('display_order');
  const { data: accommodation } = id === 'novo'
    ? { data: null }
    : await supabase.from('accommodations').select('name, cover_url, photos').eq('id', id).eq('city_id', city.id).maybeSingle();
  const accommodationName = accommodation?.name ?? 'Hospedagem';

  return (
    <div className="space-y-6">
      <header><h1 className="text-3xl font-bold">{id === 'novo' ? 'Nova hospedagem' : 'Editar hospedagem'}</h1></header>
      <AccommodationForm cityId={city.id} districts={districts ?? []} action={upsertAccommodationAction} />
      {id !== 'novo' && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <ImageUploadField
              entityType="accommodation"
              entityId={id}
              role="cover"
              label="Capa"
              currentUrl={accommodation?.cover_url}
              revalidatePath="/painel/turismo"
              helpText="Imagem principal da hospedagem."
              contextLabel={`Capa · ${accommodationName}`}
            />
            <ImageUploadField
              entityType="accommodation"
              entityId={id}
              role="gallery"
              label="Galeria"
              currentUrl={Array.isArray(accommodation?.photos) ? accommodation.photos.find((item): item is string => typeof item === 'string') : null}
              revalidatePath="/painel/turismo"
              helpText="Fotos adicionais da hospedagem."
              contextLabel={`Galeria · ${accommodationName}`}
            />
          </div>
          <SeoSuggestionDialog id={id} entityType="accommodation" action={generateSeoCopyAction} />
        </>
      )}
    </div>
  );
}
