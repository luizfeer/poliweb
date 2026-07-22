import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type DistrictOption = {
  id: string;
  name: string;
};

type AlertFormProps = {
  cityId: string;
  districts: DistrictOption[];
  action: (formData: FormData) => Promise<void>;
};

export function AlertForm({ cityId, districts, action }: AlertFormProps) {
  return (
    <form action={action} className="grid gap-4 rounded-2xl border bg-card p-5 md:grid-cols-3">
      <input type="hidden" name="city_id" value={cityId} />
      <div className="space-y-2">
        <Label htmlFor="type">Tipo</Label>
        <select id="type" name="type" className="w-full rounded-lg border bg-background px-3 py-2 text-sm" defaultValue="water">
          <option value="water">Água</option>
          <option value="energy">Energia</option>
          <option value="traffic">Trânsito</option>
          <option value="weather">Clima</option>
          <option value="security">Segurança</option>
          <option value="health">Saúde</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="severity">Severidade</Label>
        <select id="severity" name="severity" className="w-full rounded-lg border bg-background px-3 py-2 text-sm" defaultValue="info">
          <option value="info">Informativo</option>
          <option value="warning">Atenção</option>
          <option value="critical">Crítico</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="start_at">Início</Label>
        <Input id="start_at" name="start_at" type="datetime-local" required />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="title">Título</Label>
        <Input id="title" name="title" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="end_at">Fim</Label>
        <Input id="end_at" name="end_at" type="datetime-local" />
      </div>
      <div className="space-y-2 md:col-span-3">
        <Label htmlFor="description">Descrição</Label>
        <textarea id="description" name="description" rows={3} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="affected_area">Área afetada</Label>
        <Input id="affected_area" name="affected_area" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="source">Fonte</Label>
        <Input id="source" name="source" placeholder="prefeitura" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="source_url">URL da fonte</Label>
        <Input id="source_url" name="source_url" type="url" />
      </div>
      <div className="space-y-2 md:col-span-3">
        <Label>Bairros afetados</Label>
        <div className="flex flex-wrap gap-2">
          {districts.map((district) => (
            <label key={district.id} className="rounded-lg border px-3 py-2 text-sm">
              <input className="mr-2" type="checkbox" name="affected_district_ids" value={district.id} />
              {district.name}
            </label>
          ))}
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="active" defaultChecked />
        Ativo
      </label>
      <div className="md:col-span-3">
        <Button type="submit">Salvar alerta</Button>
      </div>
    </form>
  );
}
