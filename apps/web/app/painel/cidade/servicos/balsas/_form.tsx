import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { FerryRouteDetail } from '@/lib/ferries';
import { upsertFerryRouteAction } from './actions';

type Props = {
  cityId: string;
  route?: FerryRouteDetail | null;
};

const STATUS_OPTIONS = [
  ['active', 'Em operação'],
  ['active_check_before_go', 'Confirme antes de sair'],
  ['schedule_missing', 'Horário a confirmar'],
  ['suspended', 'Suspensa'],
  ['inactive', 'Inativa'],
] as const;

const CONFIDENCE_OPTIONS = [
  ['high', 'Alta confiança'],
  ['medium', 'Média confiança'],
  ['low', 'Baixa confiança'],
  ['route_confirmed_schedule_missing', 'Rota confirmada, horário pendente'],
] as const;

export function FerryRouteForm({ cityId, route }: Props) {
  return (
    <form action={upsertFerryRouteAction} className="space-y-5 rounded-2xl border bg-card p-5">
      <input type="hidden" name="city_id" value={cityId} />
      {route?.id && <input type="hidden" name="id" value={route.id} />}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nome da rota</Label>
          <Input id="name" name="name" defaultValue={route?.name ?? ''} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="short_name">Nome curto</Label>
          <Input id="short_name" name="short_name" defaultValue={route?.shortName ?? ''} placeholder="Balsa do Itaci" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" name="slug" defaultValue={route?.slug ?? ''} required placeholder="balsa-itaci-carmo-do-rio-claro" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="display_order">Ordem</Label>
          <Input id="display_order" name="display_order" type="number" defaultValue={String(route ? 0 : 0)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="endpoint_a_label">Ponto A</Label>
          <Input id="endpoint_a_label" name="endpoint_a_label" defaultValue={route?.endpointA ?? ''} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="endpoint_b_label">Ponto B</Label>
          <Input id="endpoint_b_label" name="endpoint_b_label" defaultValue={route?.endpointB ?? ''} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="region">Região</Label>
          <Input id="region" name="region" defaultValue={route?.region ?? ''} placeholder="Lago de Furnas" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="district">Distrito</Label>
          <Input id="district" name="district" defaultValue={route?.district ?? ''} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue={route?.status ?? 'active_check_before_go'}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            {STATUS_OPTIONS.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confidence">Confiança</Label>
          <select
            id="confidence"
            name="confidence"
            defaultValue={route?.confidence ?? 'medium'}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            {CONFIDENCE_OPTIONS.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Descrição</Label>
        <textarea
          id="description"
          name="description"
          defaultValue={route?.description ?? ''}
          rows={3}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="fare_summary">Resumo de tarifa</Label>
          <textarea
            id="fare_summary"
            name="fare_summary"
            defaultValue={route?.fareSummary ?? ''}
            rows={3}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fare_warning">Aviso de tarifa</Label>
          <textarea
            id="fare_warning"
            name="fare_warning"
            defaultValue={route?.fareWarning ?? ''}
            rows={3}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="important_info">Informações importantes (uma por linha)</Label>
        <textarea
          id="important_info"
          name="important_info"
          defaultValue={(route?.importantInfo ?? []).join('\n')}
          rows={5}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="related_cities">Cidades relacionadas (uma por linha)</Label>
          <textarea
            id="related_cities"
            name="related_cities"
            defaultValue={(route?.relatedCities ?? []).join('\n')}
            rows={4}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder={'Carmo do Rio Claro\nItaci\nGuapé'}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="operating_days">Dias de funcionamento (um por linha)</Label>
          <textarea
            id="operating_days"
            name="operating_days"
            defaultValue={(route?.operatingDays ?? []).join('\n')}
            rows={4}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder={'segunda-feira\nterça-feira\nquarta-feira'}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="fare_json">Tarifa estruturada (JSON)</Label>
        <textarea
          id="fare_json"
          name="fare_json"
          defaultValue={route?.fare ? JSON.stringify(route.fare, null, 2) : ''}
          rows={8}
          className="w-full rounded-md border bg-background px-3 py-2 text-xs font-mono"
          placeholder='{"currency":"BRL","prices":[{"category":"...","price":10,"label":"R$ 10,00"}]}'
        />
        <p className="text-xs text-muted-foreground">
          Estrutura: <code>currency, isFreeForResidents, freeFor[], paidFor[], prices[]</code>.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="source_json">Fonte (JSON)</Label>
        <textarea
          id="source_json"
          name="source_json"
          defaultValue={route?.source ? JSON.stringify(route.source, null, 2) : ''}
          rows={5}
          className="w-full rounded-md border bg-background px-3 py-2 text-xs font-mono"
          placeholder='{"tipo":"lei_municipal","titulo":"Lei nº 2.126 de 16 de agosto de 2010","municipio":"Carmo do Rio Claro/MG"}'
        />
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="featured" defaultChecked={route?.featured ?? false} />
          Destaque na home/listagem
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="active" defaultChecked={route ? true : true} />
          Ativa (visível ao público)
        </label>
      </div>

      <Button type="submit">{route ? 'Salvar alterações' : 'Criar rota'}</Button>
    </form>
  );
}
