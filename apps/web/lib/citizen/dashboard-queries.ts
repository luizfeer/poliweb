import 'server-only';

import { listMyClassifieds } from '@/lib/classifieds/queries';
import type { Classified } from '@/lib/classifieds/types';
import { listManagedCommunityGroups } from '@/lib/community/queries';
import type { CommunityGroup, CommunityGroupPost } from '@/lib/community/types';
import { createClient } from '@/lib/supabase/server';

const PREVIEW_LIMIT = 5;

export type CitizenBusinessSummary = {
  id: string;
  slug: string;
  name: string;
  status: string | null;
  coverUrl: string | null;
  logoUrl: string | null;
  updatedAt: string | null;
};

export type CitizenGroupPostPreview = CommunityGroupPost & {
  groupName: string;
  groupSlug: string;
};

export type CitizenDashboard = {
  classifieds: Classified[];
  groups: CommunityGroup[];
  businesses: CitizenBusinessSummary[];
  posts: CitizenGroupPostPreview[];
  counts: {
    classifieds: number;
    groups: number;
    businesses: number;
    posts: number;
  };
};

type CommunityGroupPostWithGroupRow = {
  id: string;
  city_id: string;
  group_id: string;
  author_profile_id: string;
  title: string;
  body: string | null;
  post_type: CommunityGroupPost['postType'];
  contact_phone: string | null;
  contact_whatsapp: string | null;
  contact_email: string | null;
  external_url: string | null;
  image_url: string | null;
  starts_at: string | null;
  ends_at: string | null;
  status: CommunityGroupPost['status'] | null;
  flagged_count: number | null;
  created_at: string | null;
  updated_at: string | null;
  community_groups: { name: string; slug: string } | null;
};

type BusinessRow = {
  id: string;
  slug: string;
  name: string;
  status: string | null;
  cover_url: string | null;
  logo_url: string | null;
  updated_at: string | null;
};

export async function getCitizenDashboard(
  cityId: string,
  profileId: string,
  modules: string[],
): Promise<CitizenDashboard> {
  const hasClassifieds = modules.includes('classifieds');
  const hasCommunity = modules.includes('community');
  const hasBusinesses = modules.includes('businesses');

  const supabase = await createClient();

  const [classifiedsAll, groupsAll, businessesAll, postsAll] = await Promise.all([
    hasClassifieds ? listMyClassifieds(cityId, profileId) : Promise.resolve([]),
    hasCommunity ? listManagedCommunityGroups(cityId, profileId) : Promise.resolve([]),
    hasBusinesses ? listMyBusinesses(cityId, profileId, supabase) : Promise.resolve([]),
    hasCommunity ? listMyCommunityGroupPosts(cityId, profileId, supabase) : Promise.resolve([]),
  ]);

  return {
    classifieds: classifiedsAll.slice(0, PREVIEW_LIMIT),
    groups: groupsAll.slice(0, PREVIEW_LIMIT),
    businesses: businessesAll.slice(0, PREVIEW_LIMIT),
    posts: postsAll.slice(0, PREVIEW_LIMIT),
    counts: {
      classifieds: classifiedsAll.length,
      groups: groupsAll.length,
      businesses: businessesAll.length,
      posts: postsAll.length,
    },
  };
}

async function listMyBusinesses(
  cityId: string,
  profileId: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<CitizenBusinessSummary[]> {
  const { data: managedRows } = await supabase
    .from('entity_managers')
    .select('entity_id')
    .eq('profile_id', profileId)
    .eq('entity_type', 'business');

  const managedIds = (managedRows ?? []).map((row) => row.entity_id);
  const filters = [`owner_profile_id.eq.${profileId}`];
  if (managedIds.length > 0) {
    filters.push(`id.in.(${managedIds.join(',')})`);
  }

  const { data, error } = await supabase
    .from('businesses')
    .select('id, slug, name, status, cover_url, logo_url, updated_at')
    .eq('city_id', cityId)
    .or(filters.join(','))
    .order('updated_at', { ascending: false });

  if (error) return [];

  return ((data ?? []) as BusinessRow[]).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    status: row.status,
    coverUrl: row.cover_url,
    logoUrl: row.logo_url,
    updatedAt: row.updated_at,
  }));
}

async function listMyCommunityGroupPosts(
  cityId: string,
  profileId: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<CitizenGroupPostPreview[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('community_group_posts' as any) as any)
    .select(
      'id, city_id, group_id, author_profile_id, title, body, post_type, contact_phone, contact_whatsapp, contact_email, external_url, image_url, starts_at, ends_at, status, flagged_count, created_at, updated_at, community_groups(name, slug)',
    )
    .eq('city_id', cityId)
    .eq('author_profile_id', profileId)
    .order('created_at', { ascending: false });

  if (error) return [];

  return ((data ?? []) as CommunityGroupPostWithGroupRow[]).map((row) => ({
    id: row.id,
    cityId: row.city_id,
    groupId: row.group_id,
    authorProfileId: row.author_profile_id,
    title: row.title,
    body: row.body,
    postType: row.post_type,
    contactPhone: row.contact_phone,
    contactWhatsapp: row.contact_whatsapp,
    contactEmail: row.contact_email,
    externalUrl: row.external_url,
    imageUrl: row.image_url,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status ?? 'draft',
    flaggedCount: row.flagged_count ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    groupName: row.community_groups?.name ?? 'Grupo',
    groupSlug: row.community_groups?.slug ?? '',
  }));
}
