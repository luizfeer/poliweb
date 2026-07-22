import type { ProfileRole, RoleKind } from './types';

const ROLE_PRIORITY: Record<RoleKind, number> = {
  super_admin: 50,
  city_admin: 40,
  moderator: 30,
  merchant: 20,
  citizen: 10,
};

export function getHighestRole(roles: ProfileRole[], cityId?: string): RoleKind | null {
  const scopedRoles = roles.filter((role) => {
    return role.role === 'super_admin' || !cityId || role.city_id === cityId;
  });

  return scopedRoles.reduce<RoleKind | null>((current, role) => {
    if (!current || ROLE_PRIORITY[role.role] > ROLE_PRIORITY[current]) {
      return role.role;
    }

    return current;
  }, null);
}

// super_admin bypasses all role checks except citizen-only guards.
// This is intentional: admins can operate on behalf of any merchant or moderator.
export function hasRole(roles: ProfileRole[], kinds: RoleKind[], cityId?: string): boolean {
  return roles.some((role) => {
    if (role.role === 'super_admin') {
      // super_admin passes every check that isn't citizen-only
      return kinds.some((kind) => kind !== 'citizen');
    }

    return kinds.includes(role.role) && (!cityId || role.city_id === cityId);
  });
}

export function canManageCity(roles: ProfileRole[], cityId: string): boolean {
  return hasRole(roles, ['super_admin', 'city_admin', 'moderator'], cityId);
}

export function getPanelHome(roles: ProfileRole[], cityId: string): string {
  const highest = getHighestRole(roles, cityId);

  switch (highest) {
    case 'super_admin':
      return '/painel/super/cidades';
    case 'city_admin':
    case 'moderator':
      return '/painel/cidade';
    case 'merchant':
      return '/painel/comercio';
    case 'citizen':
    default:
      return '/painel';
  }
}
