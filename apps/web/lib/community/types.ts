import type { Database, Json } from '@/lib/supabase/database.types';

export type EntityStatus = Database['public']['Enums']['entity_status'];
export type ClassifiedKind = Database['public']['Enums']['classified_kind'];
export type CommunityGroupType = 'collective' | 'association' | 'project' | 'whatsapp_group';
export type CommunityGroupPostType =
  | 'notice'
  | 'request'
  | 'donation'
  | 'opportunity'
  | 'announcement'
  | 'lost_found';

export const COMMUNITY_GROUP_TYPE_OPTIONS: Array<{ value: CommunityGroupType; label: string }> = [
  { value: 'collective', label: 'Coletivo' },
  { value: 'association', label: 'Associacao' },
  { value: 'project', label: 'Projeto' },
  { value: 'whatsapp_group', label: 'Grupo de WhatsApp' },
];

export const COMMUNITY_GROUP_CATEGORY_OPTIONS = [
  'cultura',
  'esporte',
  'religiao',
  'voluntariado',
  'educacao',
  'saude',
  'meio_ambiente',
  'bairro',
  'empregos',
  'compra_venda',
  'turismo',
  'transporte',
  'familia',
  'pets',
  'avisos',
  'outros',
] as const;

export type CommunityGroupCategory = (typeof COMMUNITY_GROUP_CATEGORY_OPTIONS)[number];

export type EventCategory = {
  id: string;
  cityId: string | null;
  slug: string;
  name: string;
  icon: string | null;
  displayOrder: number;
};

export type CommunityEvent = {
  id: string;
  cityId: string;
  slug: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string | null;
  location: string | null;
  address: string | null;
  categoryId: string | null;
  categoryName: string | null;
  organizerName: string | null;
  isFree: boolean;
  ticketUrl: string | null;
  coverUrl: string | null;
  status: EntityStatus;
  createdAt: string | null;
};

export type Classified = {
  id: string;
  cityId: string;
  type: ClassifiedKind;
  title: string;
  description: string | null;
  price: number | null;
  isNegotiable: boolean;
  categoryLabel: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactWhatsapp: string | null;
  coverUrl: string | null;
  photos: Json | null;
  status: EntityStatus;
  expiresAt: string | null;
  createdAt: string | null;
};

export type LostPet = {
  id: string;
  cityId: string;
  status: string;
  petName: string | null;
  species: string | null;
  breed: string | null;
  color: string | null;
  size: string | null;
  description: string | null;
  lastSeenAt: string | null;
  lastSeenLocation: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactWhatsapp: string | null;
  coverUrl: string | null;
  moderationStatus: EntityStatus;
  createdAt: string | null;
};

export type LostAndFound = {
  id: string;
  cityId: string;
  type: string;
  itemDescription: string;
  category: string | null;
  location: string | null;
  occurredAt: string | null;
  contactPhone: string | null;
  contactWhatsapp: string | null;
  coverUrl: string | null;
  status: string;
  moderationStatus: EntityStatus;
  createdAt: string | null;
};

export type Obituary = {
  id: string;
  cityId: string;
  fullName: string;
  age: number | null;
  photoUrl: string | null;
  deathDate: string;
  wakeLocation: string | null;
  wakeAt: string | null;
  burialAt: string | null;
  burialLocation: string | null;
  massAt: string | null;
  massLocation: string | null;
  familyMessage: string | null;
  funeralHome: string | null;
  status: EntityStatus;
  createdAt: string | null;
};

export type CommunityGroup = {
  id: string;
  cityId: string;
  ownerProfileId: string;
  slug: string;
  name: string;
  type: CommunityGroupType;
  category: string;
  shortDescription: string | null;
  description: string | null;
  coverUrl: string | null;
  thumbnailUrl: string | null;
  ogImageUrl: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactWhatsapp: string | null;
  contactEmail: string | null;
  instagramUrl: string | null;
  websiteUrl: string | null;
  whatsappInviteUrl: string | null;
  neighborhood: string | null;
  participationInstructions: string | null;
  groupRules: string | null;
  memberEstimate: number | null;
  isOfficial: boolean;
  requiresApproval: boolean;
  lastVerifiedAt: string | null;
  status: EntityStatus;
  flaggedCount: number;
  featuredUntil: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CommunityGroupPost = {
  id: string;
  cityId: string;
  groupId: string;
  authorProfileId: string;
  title: string;
  body: string | null;
  postType: CommunityGroupPostType;
  contactPhone: string | null;
  contactWhatsapp: string | null;
  contactEmail: string | null;
  externalUrl: string | null;
  imageUrl: string | null;
  startsAt: string | null;
  endsAt: string | null;
  status: EntityStatus;
  flaggedCount: number;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CommunityGroupFollower = {
  id: string;
  profileId: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: 'follower';
  createdAt: string;
};

export type ModerationEntityType =
  | 'event'
  | 'classified'
  | 'lost_pet'
  | 'lost_and_found'
  | 'community_group'
  | 'community_group_post';
export type ReportReason = 'spam' | 'inadequate' | 'fake' | 'match' | 'other';

export type ModerationItem = {
  entityType: ModerationEntityType;
  entityId: string;
  cityId: string;
  title: string;
  description: string | null;
  status: EntityStatus;
  createdAt: string | null;
  flaggedCount: number;
};

export type ContentReport = {
  id: string;
  cityId: string;
  entityType: string;
  entityId: string;
  reason: string;
  notes: string | null;
  status: string;
  createdAt: string | null;
};
