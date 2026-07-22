import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { deleteSecretAction, upsertSecretAction } from './actions';

export default async function SuperSegredosPage() {
  await requireRole({ kinds: ['super_admin'] });
  const supabase = await createClient();
  const [{ data: secrets }, { data: cities }] = await Promise.all([
    supabase
      .from('app_secrets')
      .select('id, key, scope, city_id, description, key_version, rotated_at, updated_at')
      .order('key'),
    supabase.from('cities').select('id, name, slug').order('name'),
  ]);

  const cityName = (id: string | null) =>
    cities?.find((c) => c.id === id)?.name ?? '—';

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Cofre de segredos</h1>
        <p className="text-muted-foreground">
          Credenciais cifradas com AES-GCM. Rotacione sem rebuildar — o valor é re-lido a cada minuto.
        </p>
      </header>

      <form
        action={upsertSecretAction}
        className="grid gap-4 rounded-2xl border bg-card p-5 md:grid-cols-2"
      >
        <div className="space-y-2">
          <Label htmlFor="key">Chave (UPPER_SNAKE_CASE)</Label>
          <Input id="key" name="key" required placeholder="ANTHROPIC_API_KEY" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="scope">Escopo</Label>
          <select
            id="scope"
            name="scope"
            className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
          >
            <option value="global">global</option>
            <option value="city">city</option>
          </select>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="value">Valor (será cifrado)</Label>
          <textarea
            id="value"
            name="value"
            required
            rows={3}
            className="min-h-[80px] w-full rounded-lg border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city_id">Cidade (se escopo = city)</Label>
          <select
            id="city_id"
            name="city_id"
            className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
          >
            <option value="">—</option>
            {(cities ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Descrição</Label>
          <Input id="description" name="description" placeholder="O que essa chave faz" />
        </div>
        <div className="md:col-span-2">
          <Button type="submit">Salvar / rotacionar</Button>
        </div>
      </form>

      <div className="grid gap-3">
        {(secrets ?? []).map((s) => (
          <article
            key={s.id}
            className="flex items-start justify-between gap-4 rounded-2xl border bg-card p-4"
          >
            <div className="space-y-1">
              <h2 className="font-mono font-semibold">{s.key}</h2>
              <p className="text-sm text-muted-foreground">
                {s.scope === 'global' ? 'global' : `cidade: ${cityName(s.city_id)}`} · v{s.key_version} ·
                {s.rotated_at
                  ? ` rotacionado ${new Date(s.rotated_at).toLocaleDateString('pt-BR')}`
                  : ' nunca rotacionado'}
              </p>
              {s.description ? (
                <p className="text-sm text-muted-foreground">{s.description}</p>
              ) : null}
            </div>
            <form action={deleteSecretAction}>
              <input type="hidden" name="id" value={s.id} />
              <Button type="submit" variant="destructive" size="sm">
                Remover
              </Button>
            </form>
          </article>
        ))}
        {(!secrets || secrets.length === 0) && (
          <p className="text-sm text-muted-foreground">Nenhum segredo cadastrado ainda.</p>
        )}
      </div>
    </div>
  );
}
