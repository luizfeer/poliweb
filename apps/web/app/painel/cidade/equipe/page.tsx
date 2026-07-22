import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getCurrentCity } from '@/lib/cities';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { grantRoleAction, revokeRoleAction } from './actions';

export default async function EquipePage() {
  const city = await getCurrentCity();
  if (!city) return null;

  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const supabase = await createClient();
  const { data: roles } = await supabase
    .from('profile_roles')
    .select('id, profile_id, role, city_id, created_at, profiles(full_name)')
    .or(`city_id.eq.${city.id},city_id.is.null`)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Equipe</h1>
        <p className="text-muted-foreground">Gerencie papéis de {city.name}.</p>
      </header>

      <form action={grantRoleAction} className="grid gap-4 rounded-2xl border bg-card p-5 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="profile_id">Profile ID</Label>
          <Input id="profile_id" name="profile_id" placeholder="uuid do perfil" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Papel</Label>
          <select id="role" name="role" className="h-10 rounded-lg border bg-background px-3 text-sm">
            <option value="merchant">merchant</option>
            <option value="moderator">moderator</option>
            <option value="city_admin">city_admin</option>
          </select>
        </div>
        <div className="flex items-end">
          <Button type="submit">Conceder papel</Button>
        </div>
      </form>

      <div className="overflow-hidden rounded-2xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left">
            <tr>
              <th className="p-3">Perfil</th>
              <th className="p-3">Profile ID</th>
              <th className="p-3">Papel</th>
              <th className="p-3">Ação</th>
            </tr>
          </thead>
          <tbody>
            {(roles ?? []).map((role) => {
              const profile = Array.isArray(role.profiles) ? role.profiles[0] : role.profiles;
              return (
                <tr key={role.id} className="border-t">
                  <td className="p-3">{profile?.full_name ?? 'Sem nome visível'}</td>
                  <td className="p-3 font-mono text-xs">{role.profile_id}</td>
                  <td className="p-3">{role.role}</td>
                  <td className="p-3">
                    <form action={revokeRoleAction}>
                      <input type="hidden" name="role_id" value={role.id} />
                      <Button type="submit" variant="secondary" size="sm">
                        Revogar
                      </Button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
