import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { createCityAction } from './actions';

export default async function SuperCidadesPage() {
  await requireRole({ kinds: ['super_admin'] });
  const supabase = await createClient();
  const { data: cities } = await supabase.from('cities').select('*').order('name');

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Cidades</h1>
        <p className="text-muted-foreground">Cadastro global de cidades do portal.</p>
      </header>

      <form action={createCityAction} className="grid gap-4 rounded-2xl border bg-card p-5 md:grid-cols-5">
        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" name="slug" required placeholder="guape" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" name="name" required placeholder="Guapé" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">UF</Label>
          <Input id="state" name="state" required maxLength={2} defaultValue="MG" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select id="status" name="status" className="h-10 rounded-lg border bg-background px-3 text-sm">
            <option value="coming_soon">coming_soon</option>
            <option value="active">active</option>
            <option value="paused">paused</option>
          </select>
        </div>
        <input type="hidden" name="timezone" value="America/Sao_Paulo" />
        <div className="flex items-end">
          <Button type="submit">Criar</Button>
        </div>
      </form>

      <div className="grid gap-3">
        {(cities ?? []).map((city) => (
          <article key={city.id} className="rounded-2xl border bg-card p-4">
            <h2 className="font-semibold">{city.name}</h2>
            <p className="text-sm text-muted-foreground">
              {city.slug} · {city.state} · {city.status}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
