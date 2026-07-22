import type { Database } from '@/lib/supabase/database.types';

export type RoleKind = Database['public']['Enums']['role_kind'];

export type Profile = Database['public']['Tables']['profiles']['Row'];

export type ProfileRole = Database['public']['Tables']['profile_roles']['Row'];

export type AuthContext = {
  profile: Profile;
  roles: ProfileRole[];
};
