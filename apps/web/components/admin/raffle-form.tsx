import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { RaffleSummary } from '@/lib/raffles';
import { upsertRaffleAction } from '@/app/painel/cidade/sorteios/actions';

type Props = {
  raffle?: RaffleSummary;
};

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  const offset = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
}

export function RaffleForm({ raffle }: Props) {
  return (
    <form action={upsertRaffleAction} className="space-y-4 rounded-2xl border bg-card p-6">
      {raffle && <input type="hidden" name="id" value={raffle.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">Título</Label>
          <Input
            id="title"
            name="title"
            defaultValue={raffle?.title ?? ''}
            required
            minLength={3}
            maxLength={200}
            placeholder="Sorteio do mês de maio"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            name="slug"
            defaultValue={raffle?.slug ?? ''}
            required
            pattern="[a-z0-9-]+"
            placeholder="sorteio-maio-2026"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="prize_description">Prêmio</Label>
        <Input
          id="prize_description"
          name="prize_description"
          defaultValue={raffle?.prizeDescription ?? ''}
          required
          maxLength={1000}
          placeholder="Jantar para 2 no Restaurante do Lago"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição completa (opcional)</Label>
        <textarea
          id="description"
          name="description"
          defaultValue={raffle?.description ?? ''}
          maxLength={4000}
          className="min-h-32 w-full rounded-lg border bg-background px-3 py-2 text-sm"
          placeholder="Detalhes do prêmio, regras, restrições…"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="cover_url">URL da capa (opcional)</Label>
          <Input
            id="cover_url"
            name="cover_url"
            type="url"
            defaultValue={raffle?.coverUrl ?? ''}
            placeholder="https://..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="prize_value_cents">Valor estimado em centavos (opcional)</Label>
          <Input
            id="prize_value_cents"
            name="prize_value_cents"
            type="number"
            min={0}
            defaultValue={raffle?.prizeValueCents ?? ''}
            placeholder="15000 = R$ 150,00"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="entry_cost_points">Custo por entrada (pts)</Label>
          <Input
            id="entry_cost_points"
            name="entry_cost_points"
            type="number"
            min={1}
            max={10000}
            defaultValue={raffle?.entryCostPoints ?? 100}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="max_entries_per_profile">Máx. entradas por pessoa</Label>
          <Input
            id="max_entries_per_profile"
            name="max_entries_per_profile"
            type="number"
            min={1}
            max={1000}
            defaultValue={raffle?.maxEntriesPerProfile ?? 5}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="draw_at">Data do sorteio</Label>
          <Input
            id="draw_at"
            name="draw_at"
            type="datetime-local"
            defaultValue={toLocalInput(raffle?.drawAt)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sponsor_business_id">ID do negócio patrocinador (opcional)</Label>
        <Input
          id="sponsor_business_id"
          name="sponsor_business_id"
          defaultValue={raffle?.sponsorBusinessId ?? ''}
          placeholder="UUID do negócio em /painel/cidade/comercio"
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit">{raffle ? 'Salvar alterações' : 'Criar sorteio'}</Button>
      </div>
    </form>
  );
}
