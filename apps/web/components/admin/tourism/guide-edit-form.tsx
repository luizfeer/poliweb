'use client';

import { useActionState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { upsertTourismGuideAction } from '@/app/painel/cidade/turismo/guias/actions';
import { GuideLinkedAttractionsPicker } from '@/components/admin/tourism/guide-linked-attractions-picker';
import type { LinkedAttractionInitial } from '@/components/admin/tourism/guide-linked-attractions-picker';
import { GuideSectionsEditor } from '@/components/admin/tourism/guide-sections-editor';
import { GuideStructuredFields } from '@/components/admin/tourism/guide-structured-fields';

function prettyJson(value: unknown, fallback: unknown): string {
  try {
    const v = value ?? fallback;
    return JSON.stringify(v, null, 2);
  } catch {
    return JSON.stringify(fallback, null, 2);
  }
}

type Props = {
  cityId: string;
  guide: Record<string, unknown>;
  nonAttractionEntitiesJson: string;
  linkedAttractionsInitial: LinkedAttractionInitial[];
};

export function GuideEditForm({ cityId, guide, nonAttractionEntitiesJson, linkedAttractionsInitial }: Props) {
  const [state, formAction, pending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      try {
        await upsertTourismGuideAction(formData);
        return { ok: true, message: 'Guia salvo com sucesso.' };
      } catch (caught) {
        return {
          ok: false,
          message: caught instanceof Error ? caught.message : 'Erro ao salvar.',
        };
      }
    },
    undefined,
  );

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(state.message);
    } else {
      toast.error(state.message);
    }
  }, [state]);

  const aliasesText = Array.isArray(guide.aliases)
    ? (guide.aliases as string[]).join(', ')
    : String(guide.aliases ?? '');

  return (
    <form action={formAction} className="bg-card grid w-full max-w-full gap-4 rounded-xl border p-5 md:grid-cols-2">
      <input type="hidden" name="id" value={String(guide.id)} />
      <input type="hidden" name="city_id" value={cityId} />

      <div className="md:col-span-2">
        <p className="text-muted-foreground text-sm font-semibold">Identidade</p>
      </div>

      <div className="space-y-2">
        <Label>Nome</Label>
        <Input name="name" defaultValue={String(guide.name ?? '')} required />
      </div>
      <div className="space-y-2">
        <Label>Slug público</Label>
        <Input name="slug" defaultValue={String(guide.slug ?? '')} required />
      </div>
      <div className="space-y-2">
        <Label>Tipo de guia</Label>
        <select
          name="kind"
          defaultValue={String(guide.kind ?? 'distrito')}
          className="bg-background w-full rounded-lg border px-3 py-2 text-sm"
        >
          <option value="distrito">Distrito</option>
          <option value="cidade">Cidade</option>
          <option value="tematico">Temático</option>
          <option value="roteiro">Roteiro</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label>Status</Label>
        <select
          name="status"
          defaultValue={String(guide.status ?? 'draft')}
          className="bg-background w-full rounded-lg border px-3 py-2 text-sm"
        >
          <option value="draft">Rascunho</option>
          <option value="pending">Pendente</option>
          <option value="published">Publicado</option>
          <option value="rejected">Rejeitado</option>
          <option value="archived">Arquivado</option>
        </select>
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label>Aliases (slugs alternativos, separados por vírgula)</Label>
        <textarea
          name="aliases"
          rows={2}
          defaultValue={aliasesText}
          className="bg-background w-full rounded-lg border px-3 py-2 text-sm"
          placeholder="conheca-itacy, itaci"
        />
      </div>

      <div className="flex flex-wrap items-center gap-4 md:col-span-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="featured" defaultChecked={Boolean(guide.featured)} /> Em destaque
          na listagem pública
        </label>
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label>Tagline</Label>
        <Input name="tagline" defaultValue={String(guide.tagline ?? '')} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label>Descrição (introdução)</Label>
        <textarea
          name="description"
          rows={5}
          defaultValue={String(guide.description ?? '')}
          className="bg-background w-full rounded-lg border px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label>URL da capa (legado — prefira upload na coluna ao lado)</Label>
        <Input name="cover_url" defaultValue={String(guide.cover_url ?? '')} />
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label>Vídeo do YouTube (opcional)</Label>
        <Input
          name="youtube_url"
          type="url"
          inputMode="url"
          autoComplete="off"
          defaultValue={String(guide.youtube_url ?? '')}
          placeholder="https://www.youtube.com/watch?v=… ou https://youtu.be/…"
        />
        <p className="text-muted-foreground text-xs">
          Secção própria mais abaixo na página — após destaques, texto &quot;Sobre&quot; e principais atrações (âncora
          #video). Deixe em branco para não exibir player.
        </p>
      </div>

      <div className="md:col-span-2 border-t pt-4">
        <p className="text-muted-foreground text-sm font-semibold">Contato e local</p>
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label>Endereço</Label>
        <Input name="address" defaultValue={String(guide.address ?? '')} />
      </div>
      <div className="space-y-2">
        <Label>Latitude</Label>
        <Input name="lat" defaultValue={guide.lat != null ? String(guide.lat) : ''} />
      </div>
      <div className="space-y-2">
        <Label>Longitude</Label>
        <Input name="lng" defaultValue={guide.lng != null ? String(guide.lng) : ''} />
      </div>
      <div className="space-y-2">
        <Label>Telefone</Label>
        <Input name="phone" defaultValue={String(guide.phone ?? '')} />
      </div>
      <div className="space-y-2">
        <Label>WhatsApp</Label>
        <Input name="whatsapp" defaultValue={String(guide.whatsapp ?? '')} />
      </div>
      <div className="space-y-2">
        <Label>Site</Label>
        <Input name="website" defaultValue={String(guide.website ?? '')} />
      </div>
      <div className="space-y-2">
        <Label>Instagram</Label>
        <Input name="instagram" defaultValue={String(guide.instagram ?? '')} />
      </div>

      <div className="md:col-span-2 border-t pt-4">
        <p className="text-muted-foreground text-sm font-semibold">Google / reputação</p>
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label>Google Place ID</Label>
        <Input name="google_place_id" defaultValue={String(guide.google_place_id ?? '')} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label>Google Maps URL</Label>
        <Input name="google_maps_url" defaultValue={String(guide.google_maps_url ?? '')} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label>Resumo Google (texto livre)</Label>
        <textarea
          name="google_summary"
          rows={3}
          defaultValue={String(guide.google_summary ?? '')}
          className="bg-background w-full rounded-lg border px-3 py-2 text-sm"
        />
      </div>
      <div className="space-y-2">
        <Label>Nota média (Google)</Label>
        <Input name="rating" defaultValue={guide.rating != null ? String(guide.rating) : ''} />
      </div>
      <div className="space-y-2">
        <Label>Nº de avaliações</Label>
        <Input name="reviews_count" defaultValue={guide.reviews_count != null ? String(guide.reviews_count) : ''} />
      </div>

      <div className="md:col-span-2 border-t pt-4">
        <p className="text-muted-foreground text-sm font-semibold">SEO, destaques e blocos</p>
        <p className="text-muted-foreground mt-1 text-xs">
          Os campos abaixo substituem o JSON manual para estas partes; ao salvar, o formulário envia o JSON
          gerado automaticamente.
        </p>
      </div>

      <GuideStructuredFields guide={guide} />

      <div className="md:col-span-2 border-t pt-4">
        <p className="text-muted-foreground text-sm font-semibold">Vínculos</p>
        <p className="text-muted-foreground mt-1 text-xs">
          Principais atrações exibidas em bloco próprio na página pública do guia.
        </p>
      </div>

      <GuideLinkedAttractionsPicker
        nonAttractionEntitiesJson={nonAttractionEntitiesJson}
        linkedAttractionsInitial={linkedAttractionsInitial}
      />

      <div className="md:col-span-2 border-t pt-4">
        <p className="text-muted-foreground text-sm font-semibold">Seções editoriais</p>
        <p className="text-muted-foreground mt-1 text-xs">
          Cada seção vira um bloco na página pública. Cards aceitam imagem ou vídeo curto via upload direto.
        </p>
      </div>

      <div className="space-y-2 md:col-span-2">
        <GuideSectionsEditor
          entityType="tourism_guide"
          entityId={String(guide.id)}
          initialJson={prettyJson(guide.sections, [])}
        />
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label>
          Metadados Google Photos (importação / fotos processadas — só altere se souber o formato)
        </Label>
        <textarea
          name="google_photos_json"
          rows={8}
          defaultValue={prettyJson(guide.google_photos, {})}
          className="bg-background font-mono w-full rounded-lg border px-3 py-2 text-xs"
        />
      </div>

      <div className="md:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Salvando…' : 'Salvar guia completo'}
        </Button>
      </div>
    </form>
  );
}
