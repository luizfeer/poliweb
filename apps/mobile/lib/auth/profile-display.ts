import type { User } from '@supabase/supabase-js';

type UserMetadata = {
  full_name?: string;
  name?: string;
  avatar_url?: string;
  picture?: string;
};

export function getUserDisplayProfile(user: User | null | undefined) {
  if (!user) {
    return {
      name: 'Perfil',
      shortName: 'Perfil',
      avatarUrl: null,
      initial: 'P',
    };
  }

  const meta = (user?.user_metadata ?? {}) as UserMetadata;
  const name = meta.full_name ?? meta.name ?? user.email ?? 'Você';
  const firstName = name.trim().split(/\s+/)[0] ?? '';
  const shortName = firstName.length > 0 && firstName.length <= 10 ? firstName : 'Perfil';

  return {
    name,
    shortName,
    avatarUrl: meta.avatar_url ?? meta.picture ?? null,
    initial: (firstName || name || 'P').charAt(0).toUpperCase(),
  };
}
