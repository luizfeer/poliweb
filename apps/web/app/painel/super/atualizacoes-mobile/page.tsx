import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import {
  deleteChannelAction,
  promoteChannelAction,
  toggleChannelAction,
  upsertUpdateChannelAction,
} from './actions';

export default async function SuperAtualizacoesMobilePage() {
  await requireRole({ kinds: ['super_admin'] });
  const supabase = await createClient();
  const { data: channels } = await supabase
    .from('mobile_update_channels')
    .select('*')
    .order('channel')
    .order('priority', { ascending: false });

  const grouped = (channels ?? []).reduce<Record<string, typeof channels>>((acc, c) => {
    acc[c.channel] ??= [] as never;
    acc[c.channel]!.push(c);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Atualizações do mobile (OTA)</h1>
        <p className="text-muted-foreground">
          URLs do Expo Updates por canal. Um primário ativo por canal; demais ficam como fallback.
        </p>
      </header>

      <form
        action={upsertUpdateChannelAction}
        className="grid gap-4 rounded-2xl border bg-card p-5 md:grid-cols-3"
      >
        <div className="space-y-2">
          <Label htmlFor="channel">Canal</Label>
          <select
            id="channel"
            name="channel"
            className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
          >
            <option value="production">production</option>
            <option value="preview">preview</option>
            <option value="development">development</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="label">Rótulo</Label>
          <Input id="label" name="label" required placeholder="EAS primário" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="priority">Prioridade</Label>
          <Input id="priority" name="priority" type="number" min={0} defaultValue={0} />
        </div>
        <div className="space-y-2 md:col-span-3">
          <Label htmlFor="url">URL do manifest</Label>
          <Input
            id="url"
            name="url"
            type="url"
            required
            placeholder="https://u.expo.dev/<project-id>"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="runtime_version">Runtime version</Label>
          <Input id="runtime_version" name="runtime_version" placeholder="1.0.0" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Descrição</Label>
          <Input id="description" name="description" />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="is_active" name="is_active" defaultChecked />
          <Label htmlFor="is_active">Ativo</Label>
        </div>
        <div className="md:col-span-3">
          <Button type="submit">Adicionar</Button>
        </div>
      </form>

      {Object.entries(grouped).map(([channel, list]) => (
        <section key={channel} className="space-y-2">
          <h2 className="text-xl font-semibold capitalize">{channel}</h2>
          <div className="grid gap-3">
            {(list ?? []).map((c) => (
              <article
                key={c.id}
                className={`flex items-start justify-between gap-4 rounded-2xl border bg-card p-4 ${
                  c.is_primary ? 'ring-2 ring-primary' : ''
                }`}
              >
                <div className="space-y-1">
                  <h3 className="font-semibold">
                    {c.label}
                    {c.is_primary && (
                      <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                        primário
                      </span>
                    )}
                    {!c.is_active && (
                      <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">inativo</span>
                    )}
                  </h3>
                  <p className="break-all font-mono text-xs text-muted-foreground">{c.url}</p>
                  <p className="text-sm text-muted-foreground">
                    prioridade {c.priority}
                    {c.runtime_version ? ` · runtime ${c.runtime_version}` : ''}
                  </p>
                  {c.description ? (
                    <p className="text-sm text-muted-foreground">{c.description}</p>
                  ) : null}
                </div>
                <div className="flex flex-col gap-2">
                  {!c.is_primary && (
                    <form action={promoteChannelAction}>
                      <input type="hidden" name="id" value={c.id} />
                      <Button type="submit" size="sm">
                        Promover a primário
                      </Button>
                    </form>
                  )}
                  <form action={toggleChannelAction}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="is_active" value={String(!c.is_active)} />
                    <Button type="submit" size="sm" variant="outline">
                      {c.is_active ? 'Desativar' : 'Ativar'}
                    </Button>
                  </form>
                  <form action={deleteChannelAction}>
                    <input type="hidden" name="id" value={c.id} />
                    <Button type="submit" size="sm" variant="destructive">
                      Remover
                    </Button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}

      {Object.keys(grouped).length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhum canal cadastrado.</p>
      )}
    </div>
  );
}
