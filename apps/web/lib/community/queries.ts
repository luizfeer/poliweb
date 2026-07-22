import 'server-only';

import { getCurrentCity } from '@/lib/cities';
import { publicCached } from '@/lib/cache/public-query';
import { searchTermsForBroadIlike } from '@/lib/search/query-tokens';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service';
import type {
  Classified,
  ClassifiedKind,
  CommunityGroup,
  CommunityGroupFollower,
  CommunityGroupPost,
  CommunityEvent,
  ContentReport,
  EventCategory,
  LostAndFound,
  LostPet,
  ModerationItem,
  Obituary,
} from './types';

type EventCategoryJoin = { name: string | null } | null;
type CommunityGroupRow = {
  id: string;
  city_id: string;
  owner_profile_id: string;
  slug: string;
  name: string;
  type: CommunityGroup['type'];
  category: string;
  short_description: string | null;
  description: string | null;
  cover_url: string | null;
  thumbnail_url: string | null;
  og_image_url: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_whatsapp: string | null;
  contact_email: string | null;
  instagram_url: string | null;
  website_url: string | null;
  whatsapp_invite_url: string | null;
  neighborhood: string | null;
  participation_instructions: string | null;
  group_rules: string | null;
  member_estimate: number | null;
  is_official: boolean | null;
  requires_approval: boolean | null;
  last_verified_at: string | null;
  status: CommunityGroup['status'] | null;
  flagged_count: number | null;
  featured_until: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type CommunityGroupPostRow = {
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
};

type CommunityGroupFollowerRow = {
  id: string;
  group_id: string;
  profile_id: string;
  role: 'follower';
  created_at: string;
};

type PublicProfileRow = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

type EventRow = {
  id: string;
  city_id: string;
  slug: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string | null;
  location: string | null;
  address: string | null;
  category_id: string | null;
  event_categories?: EventCategoryJoin;
  organizer_name: string | null;
  is_free: boolean | null;
  ticket_url: string | null;
  cover_url: string | null;
  status: CommunityEvent['status'] | null;
  created_at: string | null;
};

async function getCityId(cityId?: string): Promise<string | null> {
  if (cityId) return cityId;
  const city = await getCurrentCity();
  return city?.id ?? null;
}

function toEvent(row: EventRow): CommunityEvent {
  return {
    id: row.id,
    cityId: row.city_id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    startAt: row.start_at,
    endAt: row.end_at,
    location: row.location,
    address: row.address,
    categoryId: row.category_id,
    categoryName: row.event_categories?.name ?? null,
    organizerName: row.organizer_name,
    isFree: row.is_free ?? true,
    ticketUrl: row.ticket_url,
    coverUrl: row.cover_url,
    status: row.status ?? 'draft',
    createdAt: row.created_at,
  };
}

function toCommunityGroup(row: CommunityGroupRow): CommunityGroup {
  return {
    id: row.id,
    cityId: row.city_id,
    ownerProfileId: row.owner_profile_id,
    slug: row.slug,
    name: row.name,
    type: row.type,
    category: row.category,
    shortDescription: row.short_description,
    description: row.description,
    coverUrl: row.cover_url,
    thumbnailUrl: row.thumbnail_url,
    ogImageUrl: row.og_image_url,
    contactName: row.contact_name,
    contactPhone: row.contact_phone,
    contactWhatsapp: row.contact_whatsapp,
    contactEmail: row.contact_email,
    instagramUrl: row.instagram_url,
    websiteUrl: row.website_url,
    whatsappInviteUrl: row.whatsapp_invite_url,
    neighborhood: row.neighborhood,
    participationInstructions: row.participation_instructions,
    groupRules: row.group_rules,
    memberEstimate: row.member_estimate,
    isOfficial: row.is_official ?? false,
    requiresApproval: row.requires_approval ?? false,
    lastVerifiedAt: row.last_verified_at,
    status: row.status ?? 'draft',
    flaggedCount: row.flagged_count ?? 0,
    featuredUntil: row.featured_until,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const COMMUNITY_GROUP_SELECT =
  'id, city_id, owner_profile_id, slug, name, type, category, short_description, description, cover_url, thumbnail_url, og_image_url, contact_name, contact_phone, contact_whatsapp, contact_email, instagram_url, website_url, whatsapp_invite_url, neighborhood, participation_instructions, group_rules, member_estimate, is_official, requires_approval, last_verified_at, status, flagged_count, featured_until, created_at, updated_at';

function listPublicCommunityGroupsCached(params: {
  cityId: string;
  type?: CommunityGroup['type'];
  category?: string;
  q?: string;
  limit: number;
}) {
  return publicCached(
    {
      key: 'community-groups:list',
      tags: ['community-groups', `community-groups:${params.cityId}`],
      parts: [params.cityId, params.type, params.category, params.q, params.limit],
    },
    async (supabase) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase.from('community_groups' as any) as any)
        .select(COMMUNITY_GROUP_SELECT)
        .eq('city_id', params.cityId)
        .eq('status', 'published')
        .order('featured_until', { ascending: false, nullsFirst: false })
        .order('is_official', { ascending: false })
        .order('updated_at', { ascending: false })
        .limit(params.limit);

      if (params.type) query = query.eq('type', params.type);
      if (params.category) query = query.eq('category', params.category);
      if (params.q) {
        const terms = searchTermsForBroadIlike(params.q);
        if (terms.length === 1) {
          query = query.or(`name.ilike.%${terms[0]}%,short_description.ilike.%${terms[0]}%,description.ilike.%${terms[0]}%`);
        } else if (terms.length > 1) {
          const ors = terms.flatMap((term) => [
            `name.ilike.%${term}%`,
            `short_description.ilike.%${term}%`,
            `description.ilike.%${term}%`,
          ]);
          query = query.or(ors.join(','));
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return ((data ?? []) as CommunityGroupRow[]).map(toCommunityGroup);
    },
  );
}

function getPublicCommunityGroupCached(cityId: string, slug: string) {
  return publicCached(
    {
      key: 'community-groups:detail',
      tags: ['community-groups', `community-groups:${cityId}`, `community-group:${cityId}:${slug}`],
      parts: [cityId, slug],
    },
    async (supabase) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('community_groups' as any) as any)
        .select(COMMUNITY_GROUP_SELECT)
        .eq('city_id', cityId)
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle();

      if (error) throw error;
      return data ? toCommunityGroup(data as CommunityGroupRow) : null;
    },
  );
}

function toCommunityGroupPost(row: CommunityGroupPostRow): CommunityGroupPost {
  return {
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
  };
}

export async function listEventCategories(cityId?: string): Promise<EventCategory[]> {
  const resolvedCityId = await getCityId(cityId);
  if (!resolvedCityId) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('event_categories')
    .select('id, city_id, slug, name, icon, display_order')
    .or(`city_id.is.null,city_id.eq.${resolvedCityId}`)
    .order('display_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) return [];

  return (data ?? []).map((row) => ({
    id: row.id,
    cityId: row.city_id,
    slug: row.slug,
    name: row.name,
    icon: row.icon,
    displayOrder: row.display_order ?? 0,
  }));
}

export async function listEvents(params: {
  city_id?: string;
  when?: 'today' | 'week' | 'month' | 'all';
  category_id?: string;
  q?: string;
  limit?: number;
} = {}): Promise<CommunityEvent[]> {
  const cityId = await getCityId(params.city_id);
  if (!cityId) return [];

  const now = new Date();
  const end = new Date(now);
  if (params.when === 'today') end.setDate(now.getDate() + 1);
  if (params.when === 'week') end.setDate(now.getDate() + 7);
  if (params.when === 'month') end.setMonth(now.getMonth() + 1);

  const supabase = await createClient();
  let query = supabase
    .from('events')
    .select('id, city_id, slug, title, description, start_at, end_at, location, address, category_id, event_categories(name), organizer_name, is_free, ticket_url, cover_url, status, created_at')
    .eq('city_id', cityId)
    .eq('status', 'published')
    .gte('start_at', now.toISOString())
    .order('start_at', { ascending: true })
    .limit(params.limit ?? 40);

  if (params.when && params.when !== 'all') query = query.lt('start_at', end.toISOString());
  if (params.category_id) query = query.eq('category_id', params.category_id);
  if (params.q) {
    const terms = searchTermsForBroadIlike(params.q);
    if (terms.length === 1) {
      query = query.or(`title.ilike.%${terms[0]}%,description.ilike.%${terms[0]}%`);
    } else if (terms.length > 1) {
      const ors = terms.flatMap((t) => [`title.ilike.%${t}%`, `description.ilike.%${t}%`]);
      query = query.or(ors.join(','));
    }
  }

  const { data, error } = await query;
  if (error) return [];
  return ((data ?? []) as unknown as EventRow[]).map(toEvent);
}

export async function getEventBySlug(params: {
  city_id?: string;
  slug: string;
}): Promise<CommunityEvent | null> {
  const cityId = await getCityId(params.city_id);
  if (!cityId) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('events')
    .select('id, city_id, slug, title, description, start_at, end_at, location, address, category_id, event_categories(name), organizer_name, is_free, ticket_url, cover_url, status, created_at')
    .eq('city_id', cityId)
    .eq('slug', params.slug)
    .eq('status', 'published')
    .maybeSingle();

  if (error || !data) return null;
  return toEvent(data as unknown as EventRow);
}

export async function listClassifieds(params: {
  city_id?: string;
  type?: ClassifiedKind;
  q?: string;
  page?: number;
  limit?: number;
} = {}): Promise<Classified[]> {
  const cityId = await getCityId(params.city_id);
  if (!cityId) return [];

  const limit = params.limit ?? 30;
  const page = Math.max(params.page ?? 1, 1);
  const supabase = await createClient();
  let query = supabase
    .from('classifieds')
    .select('id, city_id, type, title, description, price, is_negotiable, category_label, contact_name, contact_phone, contact_whatsapp, cover_url, photos, status, expires_at, created_at')
    .eq('city_id', cityId)
    .eq('status', 'published')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (params.type) query = query.eq('type', params.type);
  if (params.q) {
    const terms = searchTermsForBroadIlike(params.q);
    if (terms.length === 1) {
      query = query.or(`title.ilike.%${terms[0]}%,description.ilike.%${terms[0]}%`);
    } else if (terms.length > 1) {
      const ors = terms.flatMap((t) => [`title.ilike.%${t}%`, `description.ilike.%${t}%`]);
      query = query.or(ors.join(','));
    }
  }

  const { data, error } = await query;
  if (error) return [];
  return (data ?? []).map((row) => ({
    id: row.id,
    cityId: row.city_id,
    type: row.type,
    title: row.title,
    description: row.description,
    price: row.price,
    isNegotiable: row.is_negotiable ?? false,
    categoryLabel: row.category_label,
    contactName: row.contact_name,
    contactPhone: row.contact_phone,
    contactWhatsapp: row.contact_whatsapp,
    coverUrl: row.cover_url,
    photos: row.photos,
    status: row.status ?? 'draft',
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  }));
}

export async function listLostPets(params: {
  city_id?: string;
  status?: 'lost' | 'found' | 'reunited';
} = {}): Promise<LostPet[]> {
  const cityId = await getCityId(params.city_id);
  if (!cityId) return [];

  const supabase = await createClient();
  let query = supabase
    .from('lost_pets')
    .select('id, city_id, status, pet_name, species, breed, color, size, description, last_seen_at, last_seen_location, contact_name, contact_phone, contact_whatsapp, cover_url, moderation_status, created_at')
    .eq('city_id', cityId)
    .eq('moderation_status', 'published')
    .order('created_at', { ascending: false });

  if (params.status) query = query.eq('status', params.status);

  const { data, error } = await query;
  if (error) return [];
  return (data ?? []).map((row) => ({
    id: row.id,
    cityId: row.city_id,
    status: row.status ?? 'lost',
    petName: row.pet_name,
    species: row.species,
    breed: row.breed,
    color: row.color,
    size: row.size,
    description: row.description,
    lastSeenAt: row.last_seen_at,
    lastSeenLocation: row.last_seen_location,
    contactName: row.contact_name,
    contactPhone: row.contact_phone,
    contactWhatsapp: row.contact_whatsapp,
    coverUrl: row.cover_url,
    moderationStatus: row.moderation_status ?? 'pending',
    createdAt: row.created_at,
  }));
}

export async function listLostAndFound(params: {
  city_id?: string;
  type?: 'lost' | 'found';
} = {}): Promise<LostAndFound[]> {
  const cityId = await getCityId(params.city_id);
  if (!cityId) return [];

  const supabase = await createClient();
  let query = supabase
    .from('lost_and_found')
    .select('id, city_id, type, item_description, category, location, occurred_at, contact_phone, contact_whatsapp, cover_url, status, moderation_status, created_at')
    .eq('city_id', cityId)
    .eq('moderation_status', 'published')
    .order('created_at', { ascending: false });

  if (params.type) query = query.eq('type', params.type);

  const { data, error } = await query;
  if (error) return [];
  return (data ?? []).map((row) => ({
    id: row.id,
    cityId: row.city_id,
    type: row.type,
    itemDescription: row.item_description,
    category: row.category,
    location: row.location,
    occurredAt: row.occurred_at,
    contactPhone: row.contact_phone,
    contactWhatsapp: row.contact_whatsapp,
    coverUrl: row.cover_url,
    status: row.status ?? 'open',
    moderationStatus: row.moderation_status ?? 'pending',
    createdAt: row.created_at,
  }));
}

export async function listObituaries(params: {
  city_id?: string;
  days?: number;
} = {}): Promise<Obituary[]> {
  const cityId = await getCityId(params.city_id);
  if (!cityId) return [];

  const since = new Date();
  since.setDate(since.getDate() - (params.days ?? 30));

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('obituaries')
    .select('id, city_id, full_name, age, photo_url, death_date, wake_location, wake_at, burial_at, burial_location, mass_at, mass_location, family_message, funeral_home, status, created_at')
    .eq('city_id', cityId)
    .eq('status', 'published')
    .gte('death_date', since.toISOString().slice(0, 10))
    .order('death_date', { ascending: false });

  if (error) return [];
  return (data ?? []).map((row) => ({
    id: row.id,
    cityId: row.city_id,
    fullName: row.full_name,
    age: row.age,
    photoUrl: row.photo_url,
    deathDate: row.death_date,
    wakeLocation: row.wake_location,
    wakeAt: row.wake_at,
    burialAt: row.burial_at,
    burialLocation: row.burial_location,
    massAt: row.mass_at,
    massLocation: row.mass_location,
    familyMessage: row.family_message,
    funeralHome: row.funeral_home,
    status: row.status ?? 'draft',
    createdAt: row.created_at,
  }));
}

export async function listCommunityGroups(params: {
  city_id?: string;
  type?: CommunityGroup['type'];
  category?: string;
  q?: string;
  managedByProfileId?: string;
  limit?: number;
} = {}): Promise<CommunityGroup[]> {
  const cityId = await getCityId(params.city_id);
  if (!cityId) return [];

  if (!params.managedByProfileId) {
    try {
      return await listPublicCommunityGroupsCached({
        cityId,
        type: params.type,
        category: params.category,
        q: params.q,
        limit: params.limit ?? 40,
      });
    } catch {
      return [];
    }
  }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase.from('community_groups' as any) as any)
    .select(COMMUNITY_GROUP_SELECT)
    .eq('city_id', cityId)
    .order('is_official', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(params.limit ?? 40);

  if (params.type) query = query.eq('type', params.type);
  if (params.category) query = query.eq('category', params.category);
  query = query.or(`owner_profile_id.eq.${params.managedByProfileId}`);
  if (params.q) {
    const terms = searchTermsForBroadIlike(params.q);
    if (terms.length === 1) {
      query = query.or(`name.ilike.%${terms[0]}%,short_description.ilike.%${terms[0]}%,description.ilike.%${terms[0]}%`);
    } else if (terms.length > 1) {
      const ors = terms.flatMap((term) => [
        `name.ilike.%${term}%`,
        `short_description.ilike.%${term}%`,
        `description.ilike.%${term}%`,
      ]);
      query = query.or(ors.join(','));
    }
  }

  const { data, error } = await query;
  if (error) return [];
  return ((data ?? []) as CommunityGroupRow[]).map(toCommunityGroup);
}

export async function listManagedCommunityGroups(cityId: string, profileId: string): Promise<CommunityGroup[]> {
  const supabase = await createClient();
  const [ownedResult, managerResult] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('community_groups' as any) as any)
      .select(COMMUNITY_GROUP_SELECT)
      .eq('city_id', cityId)
      .eq('owner_profile_id', profileId)
      .order('updated_at', { ascending: false }),
    supabase
      .from('entity_managers')
      .select('entity_id')
      .eq('profile_id', profileId)
      .eq('entity_type', 'community_group'),
  ]);

  const managerIds = (managerResult.data ?? []).map((item) => item.entity_id);
  const managerGroups = managerIds.length > 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? await (supabase.from('community_groups' as any) as any)
      .select(COMMUNITY_GROUP_SELECT)
      .eq('city_id', cityId)
      .in('id', managerIds)
      .order('updated_at', { ascending: false })
    : { data: [] };

  const deduped = new Map<string, CommunityGroup>();
  for (const row of (ownedResult.data ?? []) as CommunityGroupRow[]) deduped.set(row.id, toCommunityGroup(row));
  for (const row of (managerGroups.data ?? []) as CommunityGroupRow[]) deduped.set(row.id, toCommunityGroup(row));
  return [...deduped.values()];
}

export async function getCommunityGroupBySlug(params: {
  city_id?: string;
  slug: string;
}): Promise<CommunityGroup | null> {
  const cityId = await getCityId(params.city_id);
  if (!cityId) return null;

  try {
    return await getPublicCommunityGroupCached(cityId, params.slug);
  } catch (error) {
    console.error('[community] getCommunityGroupBySlug failed', {
      cityId,
      slug: params.slug,
      error: error instanceof Error ? error.message : error,
    });
    return null;
  }
}

export async function getManagedCommunityGroupById(params: {
  city_id?: string;
  id: string;
  profile_id: string;
  can_manage_city?: boolean;
}): Promise<CommunityGroup | null> {
  const cityId = await getCityId(params.city_id);
  if (!cityId) return null;

  const groups = await listManagedCommunityGroups(cityId, params.profile_id);
  const managedGroup = groups.find((group) => group.id === params.id);
  if (managedGroup) return managedGroup;

  if (!params.can_manage_city) return null;

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('community_groups' as any) as any)
    .select(COMMUNITY_GROUP_SELECT)
    .eq('city_id', cityId)
    .eq('id', params.id)
    .maybeSingle();

  if (error || !data) return null;
  return toCommunityGroup(data as CommunityGroupRow);
}

export async function listCommunityGroupPosts(params: {
  groupId: string;
  city_id?: string;
  includePending?: boolean;
  limit?: number;
}): Promise<CommunityGroupPost[]> {
  const cityId = await getCityId(params.city_id);
  if (!cityId) return [];

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase.from('community_group_posts' as any) as any)
    .select(
      'id, city_id, group_id, author_profile_id, title, body, post_type, contact_phone, contact_whatsapp, contact_email, external_url, image_url, starts_at, ends_at, status, flagged_count, created_at, updated_at',
    )
    .eq('city_id', cityId)
    .eq('group_id', params.groupId)
    .order('created_at', { ascending: false })
    .limit(params.limit ?? 12);

  if (!params.includePending) query = query.eq('status', 'published');

  const { data, error } = await query;
  if (error) return [];
  return ((data ?? []) as CommunityGroupPostRow[]).map(toCommunityGroupPost);
}

export async function listCommunityGroupFollowers(params: {
  city_id?: string;
  groupId: string;
  limit?: number;
}): Promise<CommunityGroupFollower[]> {
  const cityId = await getCityId(params.city_id);
  if (!cityId) return [];

  const supabase = createServiceRoleClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: followers, error } = await (supabase.from('community_group_followers' as any) as any)
    .select('id, group_id, profile_id, role, created_at')
    .eq('city_id', cityId)
    .eq('group_id', params.groupId)
    .order('created_at', { ascending: false })
    .limit(params.limit ?? 24);

  if (error || !followers || followers.length === 0) return [];

  const profileIds = (followers as CommunityGroupFollowerRow[]).map((follower) => follower.profile_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', profileIds);

  const profilesById = new Map(
    ((profiles ?? []) as PublicProfileRow[]).map((profile) => [profile.id, profile]),
  );

  return (followers as CommunityGroupFollowerRow[]).map((follower) => {
    const profile = profilesById.get(follower.profile_id);

    return {
      id: follower.id,
      profileId: follower.profile_id,
      fullName: profile?.full_name ?? null,
      avatarUrl: profile?.avatar_url ?? null,
      role: follower.role,
      createdAt: follower.created_at,
    };
  });
}

export async function isFollowingCommunityGroup(groupId: string, profileId: string): Promise<boolean> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from('community_group_followers' as any) as any)
    .select('id')
    .eq('group_id', groupId)
    .eq('profile_id', profileId)
    .maybeSingle();

  return Boolean(data);
}

export async function listModerationQueue(cityId: string): Promise<ModerationItem[]> {
  const supabase = await createClient();
  const [events, classifieds, pets, lostFound, groups, groupPosts] = await Promise.all([
    supabase.from('events').select('id, city_id, title, description, status, created_at').eq('city_id', cityId).eq('status', 'pending'),
    supabase.from('classifieds').select('id, city_id, title, description, status, created_at, flagged_count').eq('city_id', cityId).eq('status', 'pending'),
    supabase.from('lost_pets').select('id, city_id, pet_name, species, description, moderation_status, created_at, flagged_count').eq('city_id', cityId).eq('moderation_status', 'pending'),
    supabase.from('lost_and_found').select('id, city_id, item_description, category, moderation_status, created_at, flagged_count').eq('city_id', cityId).eq('moderation_status', 'pending'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('community_groups' as any) as any).select('id, city_id, name, short_description, status, created_at, flagged_count').eq('city_id', cityId).eq('status', 'pending'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('community_group_posts' as any) as any).select('id, city_id, title, body, status, created_at, flagged_count').eq('city_id', cityId).eq('status', 'pending'),
  ]);

  const items: ModerationItem[] = [];
  for (const row of events.data ?? []) {
    items.push({
      entityType: 'event',
      entityId: row.id,
      cityId: row.city_id,
      title: row.title,
      description: row.description,
      status: row.status ?? 'pending',
      createdAt: row.created_at,
      flaggedCount: 0,
    });
  }
  for (const row of classifieds.data ?? []) {
    items.push({
      entityType: 'classified',
      entityId: row.id,
      cityId: row.city_id,
      title: row.title,
      description: row.description,
      status: row.status ?? 'pending',
      createdAt: row.created_at,
      flaggedCount: row.flagged_count ?? 0,
    });
  }
  for (const row of pets.data ?? []) {
    items.push({
      entityType: 'lost_pet',
      entityId: row.id,
      cityId: row.city_id,
      title: row.pet_name ?? row.species ?? 'Pet sem nome',
      description: row.description,
      status: row.moderation_status ?? 'pending',
      createdAt: row.created_at,
      flaggedCount: row.flagged_count ?? 0,
    });
  }
  for (const row of lostFound.data ?? []) {
    items.push({
      entityType: 'lost_and_found',
      entityId: row.id,
      cityId: row.city_id,
      title: row.item_description,
      description: row.category,
      status: row.moderation_status ?? 'pending',
      createdAt: row.created_at,
      flaggedCount: row.flagged_count ?? 0,
    });
  }
  for (const row of (groups.data ?? []) as Array<{ id: string; city_id: string; name: string; short_description: string | null; status: CommunityGroup['status'] | null; created_at: string | null; flagged_count: number | null }>) {
    items.push({
      entityType: 'community_group',
      entityId: row.id,
      cityId: row.city_id,
      title: row.name,
      description: row.short_description,
      status: row.status ?? 'pending',
      createdAt: row.created_at,
      flaggedCount: row.flagged_count ?? 0,
    });
  }
  for (const row of (groupPosts.data ?? []) as Array<{ id: string; city_id: string; title: string; body: string | null; status: CommunityGroupPost['status'] | null; created_at: string | null; flagged_count: number | null }>) {
    items.push({
      entityType: 'community_group_post',
      entityId: row.id,
      cityId: row.city_id,
      title: row.title,
      description: row.body,
      status: row.status ?? 'pending',
      createdAt: row.created_at,
      flaggedCount: row.flagged_count ?? 0,
    });
  }

  return items.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
}

export async function listContentReports(cityId: string): Promise<ContentReport[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('content_reports')
    .select('id, city_id, entity_type, entity_id, reason, notes, status, created_at')
    .eq('city_id', cityId)
    .order('created_at', { ascending: false });

  if (error) return [];
  return (data ?? []).map((row) => ({
    id: row.id,
    cityId: row.city_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    reason: row.reason,
    notes: row.notes,
    status: row.status,
    createdAt: row.created_at,
  }));
}
