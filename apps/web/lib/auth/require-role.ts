import 'server-only';

import { notFound, redirect } from 'next/navigation';
import { getCurrentCity } from '@/lib/cities';
import { getProfile } from './get-profile';
import { hasRole } from './roles';
import type { AuthContext, RoleKind } from './types';

type RequireRoleOptions = {
  cityId?: string;
  kinds: RoleKind[];
  redirectTo?: string;
};

export async function requireProfile(redirectTo = '/entrar'): Promise<AuthContext> {
  const auth = await getProfile();

  if (!auth) {
    redirect(redirectTo);
  }

  return auth;
}

export async function requireRole({
  cityId,
  kinds,
  redirectTo = '/entrar',
}: RequireRoleOptions): Promise<AuthContext> {
  const auth = await requireProfile(redirectTo);
  const city = cityId ? null : await getCurrentCity();
  const resolvedCityId = cityId ?? city?.id;

  if (!resolvedCityId || !hasRole(auth.roles, kinds, resolvedCityId)) {
    notFound();
  }

  return auth;
}
