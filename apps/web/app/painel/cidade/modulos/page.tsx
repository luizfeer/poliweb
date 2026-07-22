import { Button } from '@/components/ui/button';
import { getCurrentCity } from '@/lib/cities';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { toggleCityModuleAction } from './actions';

export default async function ModulosPage() {
  const city = await getCurrentCity();
  if (!city) return null;

  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const supabase = await createClient();
  const [{ data: modules }, { data: cityModules }] = await Promise.all([
    supabase.from('modules').select('*').order('display_order'),
    supabase.from('city_modules').select('*').eq('city_id', city.id),
  ]);
  const enabledByKey = new Map((cityModules ?? []).map((module) => [module.module_key, module.enabled]));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Módulos</h1>
        <p className="text-muted-foreground">Ligue ou desligue funcionalidades em {city.name}.</p>
      </header>

      <div className="grid gap-3">
        {(modules ?? []).map((module) => (
          <form
            key={module.key}
            action={toggleCityModuleAction}
            className="flex items-center justify-between rounded-2xl border bg-card p-4"
          >
            <div>
              <h2 className="font-semibold">{module.name}</h2>
              <p className="text-sm text-muted-foreground">{module.description}</p>
            </div>
            <div className="flex items-center gap-3">
              <input type="hidden" name="module_key" value={module.key} />
              <label className="flex items-center gap-2 text-sm">
                <input name="enabled" type="checkbox" defaultChecked={enabledByKey.get(module.key) ?? false} />
                Ativo
              </label>
              <Button type="submit" size="sm">
                Salvar
              </Button>
            </div>
          </form>
        ))}
      </div>
    </div>
  );
}
