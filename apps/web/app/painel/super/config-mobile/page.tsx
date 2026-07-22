import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { deleteMobileConfigAction, upsertMobileConfigAction } from './actions';

export default async function SuperConfigMobilePage() {
  await requireRole({ kinds: ['super_admin'] });
  const supabase = await createClient();
  const { data: items } = await supabase
    .from('mobile_config')
    .select('id, key, value, description, updated_at')
    .order('key');

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Config do mobile</h1>
        <p className="text-muted-foreground">
          Valores públicos lidos pelo app no boot. Trocar aqui não requer rebuild —
          basta o usuário abrir o app de novo. Não use pra segredos (qualquer um vê).
        </p>
      </header>

      <form
        action={upsertMobileConfigAction}
        className="grid gap-4 rounded-2xl border bg-card p-5 md:grid-cols-2"
      >
        <div className="space-y-2">
          <Label htmlFor="key">Chave (UPPER_SNAKE_CASE)</Label>
          <Input id="key" name="key" required placeholder="FEATURE_X_ENABLED" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="value">Valor</Label>
          <Input id="value" name="value" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Descrição</Label>
          <Input id="description" name="description" />
        </div>
        <div className="md:col-span-2">
          <Button type="submit">Salvar</Button>
        </div>
      </form>

      <div className="grid gap-3">
        {(items ?? []).map((it) => (
          <article key={it.id} className="rounded-2xl border bg-card p-4">
            <form action={upsertMobileConfigAction} className="space-y-3">
              <input type="hidden" name="id" value={it.id} />
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor={`key-${it.id}`}>Chave</Label>
                  <Input
                    id={`key-${it.id}`}
                    name="key"
                    defaultValue={it.key}
                    required
                    className="font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`value-${it.id}`}>Valor</Label>
                  <Input id={`value-${it.id}`} name="value" defaultValue={it.value} />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor={`description-${it.id}`}>Descrição</Label>
                  <Input
                    id={`description-${it.id}`}
                    name="description"
                    defaultValue={it.description ?? ''}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  Atualizado em {new Date(it.updated_at).toLocaleString('pt-BR')}
                </p>
                <div className="flex gap-2">
                  <Button type="submit" size="sm">
                    Salvar
                  </Button>
                </div>
              </div>
            </form>
            <form action={deleteMobileConfigAction} className="mt-2">
              <input type="hidden" name="id" value={it.id} />
              <Button type="submit" variant="destructive" size="sm">
                Remover
              </Button>
            </form>
          </article>
        ))}
        {(!items || items.length === 0) && (
          <p className="text-sm text-muted-foreground">Nenhum item cadastrado.</p>
        )}
      </div>
    </div>
  );
}
