import { createPropertyDraftAction } from '@/app/painel/imobiliaria/actions';
import { SubmitOnceButton, SubmitOnceForm } from '@/components/admin/forms/submit-once-form';
import { MediaFileInput } from '@/components/admin/media/media-file-input';
import { PublicationSafetyAgreement } from '@/components/admin/publication-safety-agreement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { requireProfile } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { LISTING_TYPE_LABELS, LISTING_TYPES, PROPERTY_TYPE_LABELS, PROPERTY_TYPES } from '@/lib/real-estate';
import { createClient } from '@/lib/supabase/server';

export default async function NewPropertyPage() {
  const city = await getCurrentCity();
  if (!city) return null;
  await requireProfile();
  const supabase = await createClient();
  const { data: districts } = await supabase
    .from('districts')
    .select('id, name')
    .eq('city_id', city.id)
    .order('name', { ascending: true });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Novo imóvel</h1>
        <p className="text-muted-foreground">Cadastre o básico agora. Fotos e edição completa entram na próxima tela.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Dados principais</CardTitle>
          <CardDescription>Após salvar, envie para aprovação do admin da cidade.</CardDescription>
        </CardHeader>
        <CardContent>
          <SubmitOnceForm action={createPropertyDraftAction} className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 md:col-span-2">
              <span className="text-sm font-medium">Título</span>
              <input name="title" required className="h-9 w-full rounded-md border px-3 text-sm" />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">Finalidade</span>
              <select name="listing_type" required className="h-9 w-full rounded-md border px-3 text-sm">
                {LISTING_TYPES.map((type) => (
                  <option key={type} value={type}>{LISTING_TYPE_LABELS[type]}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">Tipo</span>
              <select name="property_type" required className="h-9 w-full rounded-md border px-3 text-sm">
                {PROPERTY_TYPES.map((type) => (
                  <option key={type} value={type}>{PROPERTY_TYPE_LABELS[type]}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">Preço de venda</span>
              <input name="price" inputMode="decimal" className="h-9 w-full rounded-md border px-3 text-sm" />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">Aluguel/temporada</span>
              <input name="rent_price" inputMode="decimal" className="h-9 w-full rounded-md border px-3 text-sm" />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">Bairro</span>
              <select name="district_id" className="h-9 w-full rounded-md border px-3 text-sm">
                <option value="">Sem bairro</option>
                {(districts ?? []).map((district) => (
                  <option key={district.id} value={district.id}>{district.name}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">Área útil m²</span>
              <input name="area_useful_m2" inputMode="decimal" className="h-9 w-full rounded-md border px-3 text-sm" />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">Quartos</span>
              <input name="bedrooms" inputMode="numeric" className="h-9 w-full rounded-md border px-3 text-sm" />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">Banheiros</span>
              <input name="bathrooms" inputMode="numeric" className="h-9 w-full rounded-md border px-3 text-sm" />
            </label>
            <label className="space-y-1 md:col-span-2">
              <span className="text-sm font-medium">Descrição</span>
              <textarea name="description" rows={5} className="w-full rounded-md border px-3 py-2 text-sm" />
            </label>
            <div className="md:col-span-2">
              <MediaFileInput
                name="cover_file"
                label="Foto de capa"
                helpText="Use uma foto clara da fachada, sala ou vista principal. Ela aparece na vitrine."
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic,image/heif"
              />
            </div>
            <div className="md:col-span-2">
              <MediaFileInput
                name="gallery_files"
                label="Galeria de fotos e vídeos"
                helpText="Adicione quartos, banheiros, área externa, rua e vídeos curtos do imóvel."
                multiple
              />
            </div>
            <div className="md:col-span-2">
              <PublicationSafetyAgreement />
            </div>
            <div className="sticky bottom-3 z-10 rounded-2xl border bg-card/95 p-3 shadow-lg backdrop-blur md:col-span-2">
              <SubmitOnceButton
                label="Salvar rascunho"
                pendingLabel="Salvando e enviando mídia..."
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:cursor-wait disabled:opacity-75"
              />
            </div>
          </SubmitOnceForm>
        </CardContent>
      </Card>
    </div>
  );
}
