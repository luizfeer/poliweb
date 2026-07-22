'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, X } from 'lucide-react';

const attractionKinds = [
  { value: 'balneario', label: 'Balneário' },
  { value: 'mirante', label: 'Mirante' },
  { value: 'cachoeira', label: 'Cachoeira' },
  { value: 'trilha', label: 'Trilha' },
  { value: 'igreja', label: 'Igreja' },
  { value: 'museu', label: 'Museu' },
  { value: 'parque', label: 'Parque' },
  { value: 'praia', label: 'Praia' },
  { value: 'lago', label: 'Lago' },
  { value: 'historico', label: 'Histórico' },
] as const;

type Props = {
  cityId: string;
  action: (formData: FormData) => Promise<void>;
};

export function AttractionFormModal({ cityId, action }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await action(formData);
      setOpen(false);
    });
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="size-4" />
        Nova atração
      </Button>

      {open && (
        <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/50 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[10vh]">
          <div className="relative w-full max-w-3xl rounded-xl border bg-card p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Nova atração</h2>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 hover:bg-muted"
                type="button"
              >
                <X className="size-4" />
              </button>
            </div>

            <form action={handleSubmit} className="grid gap-4 md:grid-cols-4">
              <input type="hidden" name="city_id" value={cityId} />
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" name="slug" placeholder="recanto-da-furnas" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <select
                  id="type"
                  name="type"
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                >
                  {attractionKinds.map((kind) => (
                    <option key={kind.value} value={kind.value}>
                      {kind.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  name="status"
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                >
                  <option value="draft">Rascunho</option>
                  <option value="pending">Pendente</option>
                  <option value="published">Publicado</option>
                  <option value="rejected">Rejeitado</option>
                  <option value="archived">Arquivado</option>
                </select>
              </div>
              <div className="space-y-2 md:col-span-4">
                <Label htmlFor="description">Descrição</Label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Endereço</Label>
                <Input id="address" name="address" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lat">Latitude</Label>
                <Input id="lat" name="lat" inputMode="decimal" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lng">Longitude</Label>
                <Input id="lng" name="lng" inputMode="decimal" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="difficulty">Dificuldade</Label>
                <Input id="difficulty" name="difficulty" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration_minutes">Duração min.</Label>
                <Input id="duration_minutes" name="duration_minutes" type="number" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="entry_fee">Entrada</Label>
                <Input id="entry_fee" name="entry_fee" placeholder="Gratuito, R$ 20..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="best_season">Melhor época</Label>
                <Input id="best_season" name="best_season" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" name="phone" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input id="whatsapp" name="whatsapp" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Site</Label>
                <Input id="website" name="website" type="url" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <Input id="instagram" name="instagram" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="amenities">Comodidades</Label>
                <Input
                  id="amenities"
                  name="amenities"
                  placeholder="banheiro, estacionamento, restaurante"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price_range">Faixa de preço</Label>
                <Input id="price_range" name="price_range" placeholder="$, $$, gratuito" />
              </div>
              <div className="flex items-center gap-4 pt-7">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="featured" /> Destaque
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="pet_friendly" /> Pet
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="family_friendly" /> Família
                </label>
              </div>
              <div className="space-y-2 md:col-span-4">
                <Label htmlFor="tips">Dicas</Label>
                <textarea
                  id="tips"
                  name="tips"
                  rows={2}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="flex gap-2 md:col-span-4">
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Salvando…' : 'Salvar atração'}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
