'use client';

import { useActionState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { upsertAttractionAction } from '@/app/painel/cidade/turismo/atracoes/actions';

type Props = {
  cityId: string;
  attraction: Record<string, unknown>;
};

export function AttractionEditForm({ cityId, attraction }: Props) {
  const [state, formAction, pending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      try {
        await upsertAttractionAction(formData);
        return { ok: true, message: 'Atração salva com sucesso.' };
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

  return (
    <form action={formAction} className="grid gap-4 rounded-2xl border border-ink-100 bg-card p-4 shadow-card md:grid-cols-2 md:p-5">
      <input type="hidden" name="id" value={String(attraction.id)} />
      <input type="hidden" name="city_id" value={cityId} />
      <div className="md:col-span-2">
        <h2 className="text-base font-semibold">Dados da atração</h2>
        <p className="mt-1 text-sm text-muted-foreground">Edite por blocos. Os campos principais ficam no topo e a mídia fica na lateral da página.</p>
      </div>
      <div className="space-y-2 rounded-xl border border-ink-100 bg-paper/60 p-3">
        <Label>Nome</Label>
        <Input name="name" defaultValue={String(attraction.name ?? '')} required />
      </div>
      <div className="space-y-2 rounded-xl border border-ink-100 bg-paper/60 p-3">
        <Label>Slug</Label>
        <Input name="slug" defaultValue={String(attraction.slug ?? '')} required />
      </div>
      <div className="space-y-2 rounded-xl border border-ink-100 bg-paper/60 p-3">
        <Label>Tipo</Label>
        <select
          name="type"
          defaultValue={String(attraction.type ?? 'balneario')}
          className="bg-background w-full rounded-lg border px-3 py-2 text-sm"
        >
          <option value="balneario">Balneário</option>
          <option value="mirante">Mirante</option>
          <option value="cachoeira">Cachoeira</option>
          <option value="trilha">Trilha</option>
          <option value="igreja">Igreja</option>
          <option value="museu">Museu</option>
          <option value="parque">Parque</option>
          <option value="praia">Praia</option>
          <option value="lago">Lago</option>
          <option value="historico">Histórico</option>
        </select>
      </div>
      <div className="space-y-2 rounded-xl border border-ink-100 bg-paper/60 p-3">
        <Label>Status</Label>
        <select
          name="status"
          defaultValue={String(attraction.status ?? 'draft')}
          className="bg-background w-full rounded-lg border px-3 py-2 text-sm"
        >
          <option value="draft">Rascunho</option>
          <option value="pending">Pendente</option>
          <option value="published">Publicado</option>
          <option value="rejected">Rejeitado</option>
          <option value="archived">Arquivado</option>
        </select>
      </div>
      <div className="space-y-2 rounded-xl border border-ink-100 bg-paper/60 p-3 md:col-span-2">
        <Label>Descrição</Label>
        <textarea
          name="description"
          rows={4}
          defaultValue={String(attraction.description ?? '')}
          className="bg-background w-full rounded-lg border px-3 py-2 text-sm"
        />
      </div>
      <div className="border-t border-ink-100 pt-2 md:col-span-2">
        <h3 className="text-sm font-semibold text-ink-800">Localização</h3>
      </div>
      <div className="space-y-2 rounded-xl border border-ink-100 bg-paper/60 p-3 md:col-span-2">
        <Label>Endereço</Label>
        <Input name="address" defaultValue={String(attraction.address ?? '')} />
      </div>
      <div className="space-y-2 rounded-xl border border-ink-100 bg-paper/60 p-3">
        <Label>Latitude</Label>
        <Input name="lat" defaultValue={String(attraction.lat ?? '')} />
      </div>
      <div className="space-y-2 rounded-xl border border-ink-100 bg-paper/60 p-3">
        <Label>Longitude</Label>
        <Input name="lng" defaultValue={String(attraction.lng ?? '')} />
      </div>
      <div className="border-t border-ink-100 pt-2 md:col-span-2">
        <h3 className="text-sm font-semibold text-ink-800">Contato</h3>
      </div>
      <div className="space-y-2 rounded-xl border border-ink-100 bg-paper/60 p-3">
        <Label>Telefone</Label>
        <Input name="phone" defaultValue={String(attraction.phone ?? '')} />
      </div>
      <div className="space-y-2 rounded-xl border border-ink-100 bg-paper/60 p-3">
        <Label>WhatsApp</Label>
        <Input name="whatsapp" defaultValue={String(attraction.whatsapp ?? '')} />
      </div>
      <div className="space-y-2 rounded-xl border border-ink-100 bg-paper/60 p-3">
        <Label>Site</Label>
        <Input name="website" defaultValue={String(attraction.website ?? '')} />
      </div>
      <div className="space-y-2 rounded-xl border border-ink-100 bg-paper/60 p-3">
        <Label>Instagram</Label>
        <Input name="instagram" defaultValue={String(attraction.instagram ?? '')} />
      </div>
      <div className="border-t border-ink-100 pt-2 md:col-span-2">
        <h3 className="text-sm font-semibold text-ink-800">Experiência</h3>
      </div>
      <div className="space-y-2 rounded-xl border border-ink-100 bg-paper/60 p-3">
        <Label>Dificuldade</Label>
        <Input name="difficulty" defaultValue={String(attraction.difficulty ?? '')} />
      </div>
      <div className="space-y-2 rounded-xl border border-ink-100 bg-paper/60 p-3">
        <Label>Duração min.</Label>
        <Input name="duration_minutes" type="number" defaultValue={String(attraction.duration_minutes ?? '')} />
      </div>
      <div className="space-y-2 rounded-xl border border-ink-100 bg-paper/60 p-3">
        <Label>Entrada</Label>
        <Input name="entry_fee" defaultValue={String(attraction.entry_fee ?? '')} />
      </div>
      <div className="space-y-2 rounded-xl border border-ink-100 bg-paper/60 p-3">
        <Label>Melhor época</Label>
        <Input name="best_season" defaultValue={String(attraction.best_season ?? '')} />
      </div>
      <div className="space-y-2 rounded-xl border border-ink-100 bg-paper/60 p-3 md:col-span-2">
        <Label>Dicas</Label>
        <textarea
          name="tips"
          rows={2}
          defaultValue={String(attraction.tips ?? '')}
          className="bg-background w-full rounded-lg border px-3 py-2 text-sm"
        />
      </div>
      <div className="space-y-2 rounded-xl border border-ink-100 bg-paper/60 p-3">
        <Label>Comodidades</Label>
        <Input
          name="amenities"
          defaultValue={
            Array.isArray(attraction.amenities) ? attraction.amenities.join(', ') : String(attraction.amenities ?? '')
          }
        />
      </div>
      <div className="space-y-2 rounded-xl border border-ink-100 bg-paper/60 p-3">
        <Label>Faixa de preço</Label>
        <Input name="price_range" defaultValue={String(attraction.price_range ?? '')} />
      </div>
      <div className="border-t border-ink-100 pt-2 md:col-span-2">
        <h3 className="text-sm font-semibold text-ink-800">Marcadores</h3>
      </div>
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-ink-100 bg-paper/60 p-3 md:col-span-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="featured" defaultChecked={Boolean(attraction.featured)} /> Destaque
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="pet_friendly" defaultChecked={Boolean(attraction.pet_friendly)} /> Pet
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="family_friendly" defaultChecked={Boolean(attraction.family_friendly)} /> Família
        </label>
      </div>
      <div className="md:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Salvando…' : 'Salvar geral'}
        </Button>
      </div>
    </form>
  );
}
