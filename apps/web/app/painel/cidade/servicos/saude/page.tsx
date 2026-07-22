import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getCurrentCity } from '@/lib/cities';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { listHealthCampaigns, listHealthFacilities } from '@/lib/utilities/queries';
import { upsertHealthCampaignAction, upsertHealthFacilityAction } from './actions';

export default async function ServicosSaudeAdminPage() {
  const city = await getCurrentCity();
  if (!city) return null;

  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const supabase = await createClient();
  const [{ data: districts }, facilities, campaigns] = await Promise.all([
    supabase.from('districts').select('id, name').eq('city_id', city.id).order('display_order'),
    listHealthFacilities({ city_id: city.id, includeInactive: true }),
    listHealthCampaigns({ city_id: city.id, includeInactive: true }),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Saúde</h1>
        <p className="text-muted-foreground">Unidades de atendimento e campanhas.</p>
      </header>
      <form action={upsertHealthFacilityAction} className="grid gap-4 rounded-2xl border bg-card p-5 md:grid-cols-4">
        <input type="hidden" name="city_id" value={city.id} />
        <div className="space-y-2">
          <Label htmlFor="name">Unidade</Label>
          <Input id="name" name="name" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Tipo</Label>
          <select id="type" name="type" className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
            <option value="ubs">UBS</option>
            <option value="hospital">Hospital</option>
            <option value="upa">UPA</option>
            <option value="odonto">Odonto</option>
            <option value="psf">PSF</option>
            <option value="caps">CAPS</option>
            <option value="secretaria">Secretaria</option>
            <option value="farmacia-publica">Farmácia pública</option>
            <option value="vacinacao">Vacinação</option>
            <option value="vigilancia">Vigilância</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="district_id">Bairro</Label>
          <select id="district_id" name="district_id" className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
            <option value="">Sem bairro</option>
            {(districts ?? []).map((district) => <option key={district.id} value={district.id}>{district.name}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input id="phone" name="phone" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="secondary_phone">Telefone secundário</Label>
          <Input id="secondary_phone" name="secondary_phone" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input id="whatsapp" name="whatsapp" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="neighborhood">Bairro/território</Label>
          <Input id="neighborhood" name="neighborhood" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">Endereço</Label>
          <Input id="address" name="address" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="hours_legacy_text">Horário</Label>
          <Input id="hours_legacy_text" name="hours_legacy_text" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="services">Serviços</Label>
          <Input id="services" name="services" placeholder="vacinacao, pediatria" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="requirements">Requisitos</Label>
          <Input id="requirements" name="requirements" placeholder="Cartão SUS, documento" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tags">Tags</Label>
          <Input id="tags" name="tags" placeholder="esf, atenção básica" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="display_order">Ordem</Label>
          <Input id="display_order" name="display_order" type="number" defaultValue="0" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="active" defaultChecked />
          Ativa
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="needs_verification" />
          Precisa de verificação
        </label>
        <div className="md:col-span-4">
          <Button type="submit">Salvar unidade</Button>
        </div>
      </form>

      <form action={upsertHealthCampaignAction} className="grid gap-4 rounded-2xl border bg-card p-5 md:grid-cols-3">
        <input type="hidden" name="city_id" value={city.id} />
        <div className="space-y-2">
          <Label htmlFor="title">Campanha</Label>
          <Input id="title" name="title" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="vaccine_or_topic">Tema</Label>
          <Input id="vaccine_or_topic" name="vaccine_or_topic" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="target_group">Público</Label>
          <Input id="target_group" name="target_group" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="start_at">Início</Label>
          <Input id="start_at" name="start_at" type="datetime-local" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_at">Fim</Label>
          <Input id="end_at" name="end_at" type="datetime-local" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Local</Label>
          <Input id="location" name="location" />
        </div>
        <div className="space-y-2 md:col-span-3">
          <Label htmlFor="description">Descrição</Label>
          <textarea id="description" name="description" rows={3} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="active" defaultChecked />
          Ativa
        </label>
        <div className="md:col-span-3">
          <Button type="submit">Salvar campanha</Button>
        </div>
      </form>

      <section className="grid gap-3 md:grid-cols-2">
        {facilities.map((facility) => (
          <article key={facility.id} className="rounded-2xl border bg-card p-4">
            <h2 className="font-semibold">{facility.name}</h2>
            <p className="text-sm text-muted-foreground">{facility.type} · {facility.districtName ?? 'sem bairro'}</p>
          </article>
        ))}
        {campaigns.map((campaign) => (
          <article key={campaign.id} className="rounded-2xl border bg-card p-4">
            <h2 className="font-semibold">{campaign.title}</h2>
            <p className="text-sm text-muted-foreground">{campaign.vaccineOrTopic ?? 'campanha'} · {campaign.active ? 'ativa' : 'inativa'}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
