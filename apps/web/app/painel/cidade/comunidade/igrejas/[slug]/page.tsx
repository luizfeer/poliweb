import { Link } from '@/components/navigation/link';
import { notFound } from 'next/navigation';
import { GalleryUploadField, type GalleryMedia } from '@/components/admin/media/gallery-upload-field';
import { ImageUploadField } from '@/components/admin/media/image-upload-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { requireRole } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { createClient } from '@/lib/supabase/server';
import {
  deleteChurchScheduleItemAction,
  updateChurchProfileAction,
  upsertChurchScheduleItemAction,
} from './actions';
import { GoogleChurchImport } from './google-church-import';

type PageProps = {
  params: Promise<{ slug: string }>;
};

const weekdays = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terca-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sabado' },
];

export default async function EditChurchPage({ params }: PageProps) {
  const [{ slug }, city] = await Promise.all([params, getCurrentCity()]);
  if (!city || !city.modules.includes('community')) notFound();

  await requireRole({ cityId: city.id, kinds: ['moderator', 'city_admin', 'super_admin'] });

  const supabase = await createClient();
  const { data: church } = await supabase
    .from('churches')
    .select('*')
    .eq('city_id', city.id)
    .eq('slug', slug)
    .maybeSingle();
  if (!church) notFound();

  const [{ data: schedule }, { data: galleryLinks }] = await Promise.all([
    supabase
      .from('church_schedule_items')
      .select('*')
      .eq('city_id', city.id)
      .eq('church_id', church.id)
      .order('weekday', { ascending: true })
      .order('starts_at', { ascending: true }),
    supabase
      .from('media_links')
      .select('asset_id, media_assets(cdn_url, content_type)')
      .eq('city_id', city.id)
      .eq('entity_type', 'church')
      .eq('entity_id', church.id)
      .eq('role', 'gallery')
      .order('position', { ascending: false }),
  ]);
  const galleryMedia: GalleryMedia[] = (galleryLinks ?? []).flatMap((link) => {
    const asset = link.media_assets as { cdn_url?: string | null; content_type?: string | null } | null;
    return asset?.cdn_url
      ? [{ assetId: link.asset_id, url: asset.cdn_url, contentType: asset.content_type }]
      : [];
  });

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border bg-card p-6">
        <Link className="text-sm text-muted-foreground hover:underline" href="/painel/cidade/comunidade">
          Voltar para comunidade
        </Link>
        <h1 className="mt-2 text-3xl font-bold">{church.name}</h1>
        <p className="mt-2 text-muted-foreground">Perfil publico da igreja e calendario semanal.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            className="rounded-lg border px-3 py-2 text-sm hover:bg-muted"
            href={`/comunidade/igrejas/${church.slug}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Ver pagina publica
          </Link>
          <Link className="rounded-lg border px-3 py-2 text-sm hover:bg-muted" href={`/painel/cidade/comunidade/igrejas/${church.slug}/avaliacoes`}>
            Avaliacoes
          </Link>
          <Link className="rounded-lg border px-3 py-2 text-sm hover:bg-muted" href={`/painel/cidade/comunidade/igrejas/${church.slug}/novidades`}>
            Novidades
          </Link>
        </div>
      </header>

      <form action={updateChurchProfileAction} className="grid gap-4 rounded-2xl border bg-card p-5 md:grid-cols-2">
        <input type="hidden" name="id" value={church.id} />
        <input type="hidden" name="city_id" value={city.id} />

        <div className="space-y-2">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" name="name" defaultValue={church.name} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" name="slug" defaultValue={church.slug} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tradition">Tradicao</Label>
          <select id="tradition" name="tradition" defaultValue={church.tradition} className="h-8 w-full rounded-lg border bg-background px-3 text-sm">
            <option value="catolica">Catolica</option>
            <option value="evangelica">Evangelica</option>
            <option value="adventista">Adventista</option>
            <option value="outra">Outra</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select id="status" name="status" defaultValue={church.status} className="h-8 w-full rounded-lg border bg-background px-3 text-sm">
            <option value="draft">Rascunho</option>
            <option value="pending">Pendente</option>
            <option value="published">Publicado</option>
            <option value="archived">Arquivado</option>
          </select>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="short_description">Descricao curta</Label>
          <Input id="short_description" name="short_description" defaultValue={church.short_description ?? ''} required />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Descricao</Label>
          <textarea
            id="description"
            name="description"
            defaultValue={church.description ?? ''}
            className="min-h-28 w-full rounded-lg border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pastor_name">Responsavel</Label>
          <Input id="pastor_name" name="pastor_name" defaultValue={church.pastor_name ?? ''} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input id="phone" name="phone" defaultValue={church.phone ?? ''} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input id="whatsapp" name="whatsapp" defaultValue={church.whatsapp ?? ''} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={church.email ?? ''} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="instagram">Instagram</Label>
          <Input id="instagram" name="instagram" defaultValue={church.instagram ?? ''} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="website">Site</Label>
          <Input id="website" name="website" type="url" defaultValue={church.website ?? ''} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">Endereco</Label>
          <Input id="address" name="address" defaultValue={church.address ?? ''} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="google_maps_url">Google Maps</Label>
          <Input id="google_maps_url" name="google_maps_url" type="url" defaultValue={church.google_maps_url ?? ''} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lat">Latitude</Label>
          <Input id="lat" name="lat" defaultValue={church.lat ?? ''} inputMode="decimal" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lng">Longitude</Label>
          <Input id="lng" name="lng" defaultValue={church.lng ?? ''} inputMode="decimal" />
        </div>
        <div className="flex flex-wrap gap-4 text-sm md:col-span-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="featured" defaultChecked={church.featured} />
            Destaque
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="verified" defaultChecked={church.verified} />
            Verificada
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="claimed" defaultChecked={church.claimed} />
            Reivindicada
          </label>
        </div>
        <div className="md:col-span-2">
          <Button type="submit">Salvar perfil</Button>
        </div>
      </form>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold">Fotos da igreja</h2>
          <p className="text-sm text-muted-foreground">Capa, logo/imagem de perfil e galeria usam o mesmo envio dos comercios.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <ImageUploadField
            entityType="church"
            entityId={church.id}
            role="cover"
            label="Capa"
            currentUrl={church.cover_url}
            revalidatePath={`/painel/cidade/comunidade/igrejas/${church.slug}`}
            helpText="Imagem horizontal exibida no topo da pagina publica."
            contextLabel={`Capa · ${church.name}`}
          />
          <ImageUploadField
            entityType="church"
            entityId={church.id}
            role="logo"
            label="Logo / imagem de perfil"
            currentUrl={church.logo_url}
            revalidatePath={`/painel/cidade/comunidade/igrejas/${church.slug}`}
            helpText="Imagem quadrada exibida junto ao nome da igreja."
            contextLabel={`Logo · ${church.name}`}
          />
          <div className="lg:col-span-2">
            <GalleryUploadField
              entityType="church"
              entityId={church.id}
              media={galleryMedia}
              revalidatePath={`/painel/cidade/comunidade/igrejas/${church.slug}`}
              helpText="Cada envio adiciona uma foto ou video na galeria publica."
              contextLabel={`Galeria · ${church.name}`}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-3 rounded-2xl border bg-card p-5">
        <div>
          <h2 className="text-xl font-bold">Importar do Google</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Busque a ficha no Google Places e aprove apenas os dados que devem entrar nesta igreja.
          </p>
        </div>
        <GoogleChurchImport churchId={church.id} defaultQuery={`${church.name} ${church.address ?? ''}`} />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold">Calendario semanal</h2>
          <p className="text-sm text-muted-foreground">Adicione cultos, missas, reunioes e horarios fixos.</p>
        </div>

        <ScheduleForm churchId={church.id} cityId={city.id} />

        <div className="grid gap-3">
          {(schedule ?? []).map((item) => (
            <article key={item.id} className="rounded-2xl border bg-card p-4">
              <ScheduleForm
                id={item.id}
                churchId={church.id}
                cityId={city.id}
                weekday={item.weekday}
                startsAt={item.starts_at}
                endsAt={item.ends_at}
                title={item.title}
                note={item.note}
                sourceStatus={item.source_status}
                active={item.active}
              />
              <form action={deleteChurchScheduleItemAction} className="mt-3">
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="church_id" value={church.id} />
                <input type="hidden" name="city_id" value={city.id} />
                <Button type="submit" variant="destructive" size="sm">
                  Remover horario
                </Button>
              </form>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function ScheduleForm({
  id,
  churchId,
  cityId,
  weekday = 0,
  startsAt = '19:00',
  endsAt = '',
  title = '',
  note = '',
  sourceStatus = 'needs_verification',
  active = true,
}: {
  id?: string;
  churchId: string;
  cityId: string;
  weekday?: number;
  startsAt?: string;
  endsAt?: string | null;
  title?: string;
  note?: string | null;
  sourceStatus?: string;
  active?: boolean;
}) {
  return (
    <form action={upsertChurchScheduleItemAction} className="grid gap-3 rounded-2xl border bg-card p-4 md:grid-cols-6">
      {id ? <input type="hidden" name="id" value={id} /> : null}
      <input type="hidden" name="church_id" value={churchId} />
      <input type="hidden" name="city_id" value={cityId} />
      <div className="space-y-2">
        <Label>Dia</Label>
        <select name="weekday" defaultValue={weekday} className="h-8 w-full rounded-lg border bg-background px-3 text-sm">
          {weekdays.map((day) => (
            <option key={day.value} value={day.value}>
              {day.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label>Inicio</Label>
        <Input name="starts_at" type="time" defaultValue={startsAt.slice(0, 5)} required />
      </div>
      <div className="space-y-2">
        <Label>Fim</Label>
        <Input name="ends_at" type="time" defaultValue={endsAt?.slice(0, 5) ?? ''} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label>Titulo</Label>
        <Input name="title" defaultValue={title} placeholder="Missa, culto, reuniao..." required />
      </div>
      <div className="space-y-2">
        <Label>Fonte</Label>
        <select name="source_status" defaultValue={sourceStatus} className="h-8 w-full rounded-lg border bg-background px-3 text-sm">
          <option value="confirmed">Confirmado</option>
          <option value="needs_verification">A verificar</option>
        </select>
      </div>
      <div className="space-y-2 md:col-span-5">
        <Label>Observacao</Label>
        <Input name="note" defaultValue={note ?? ''} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="active" defaultChecked={active} />
        Ativo
      </label>
      <div className="md:col-span-6">
        <Button type="submit" size="sm">
          {id ? 'Salvar horario' : 'Adicionar horario'}
        </Button>
      </div>
    </form>
  );
}
