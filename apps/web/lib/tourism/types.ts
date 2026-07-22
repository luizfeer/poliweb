import type { Database } from '@/lib/supabase/database.types';

export type EntityStatus = Database['public']['Enums']['entity_status'];
export type AccommodationKind = Database['public']['Enums']['accommodation_kind'];
export type AttractionKind = Database['public']['Enums']['attraction_kind'];

export type Accommodation = {
  id: string;
  cityId: string;
  districtId: string | null;
  districtName: string | null;
  slug: string;
  name: string;
  type: AccommodationKind;
  shortDescription: string | null;
  description: string | null;
  address: string | null;
  cep: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  bookingUrl: string | null;
  airbnbUrl: string | null;
  instagram: string | null;
  priceMin: number | null;
  priceMax: number | null;
  roomsCount: number | null;
  maxGuests: number | null;
  amenities: string[];
  nearLake: boolean;
  hasMarina: boolean;
  coverUrl: string | null;
  photos: string[];
  rating: number | null;
  ownerProfileId: string | null;
  status: EntityStatus;
  featured: boolean;
  featuredUntil?: string | null;
  verified: boolean;
  aiSummary: boolean;
  ogImageUrl?: string;
  ogSquareImageUrl?: string;
};

export type TourismRestaurant = {
  id: string;
  cityId: string;
  districtId: string | null;
  districtName: string | null;
  slug: string;
  name: string;
  description: string | null;
  cuisine: string[];
  priceRange: string | null;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  hours: Record<string, unknown>;
  delivery: boolean;
  ifoodUrl: string | null;
  coverUrl: string | null;
  photos: string[];
  lat: number | null;
  lng: number | null;
  ownerProfileId: string | null;
  status: EntityStatus;
  featured: boolean;
  featuredUntil?: string | null;
  rating: number | null;
  aiSummary: boolean;
  ogImageUrl?: string;
  ogSquareImageUrl?: string;
};

export type Attraction = {
  id: string;
  cityId: string;
  slug: string;
  name: string;
  type: AttractionKind;
  description: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  hoursLegacyText: string | null;
  entryFee: string | null;
  difficulty: string | null;
  durationMinutes: number | null;
  coverUrl: string | null;
  photos: string[];
  bestSeason: string | null;
  ownerProfileId: string | null;
  googlePlaceId: string | null;
  googleMapsUrl: string | null;
  streetViewUrl: string | null;
  rating: number | null;
  reviewsCount: number;
  googleSummary: string | null;
  googlePhotos: GoogleAttractionPhoto[];
  googleReviews: GoogleAttractionReview[];
  phone: string | null;
  whatsapp: string | null;
  website: string | null;
  instagram: string | null;
  accessibility: Record<string, unknown>;
  amenities: string[];
  tips: string | null;
  priceRange: string | null;
  petFriendly: boolean;
  familyFriendly: boolean;
  status: EntityStatus;
  featured: boolean;
  ogImageUrl?: string;
  ogSquareImageUrl?: string;
};

export type GoogleAttractionPhoto = {
  name: string;
  role: string | null;
  attribution: string | null;
  url: string | null;
};

export type GoogleAttractionReview = {
  id: string;
  authorName: string | null;
  authorUrl: string | null;
  rating: number | null;
  text: string | null;
  relativeTime: string | null;
  publishedAt: string | null;
};

export type AttractionReview = {
  id: string;
  attractionId: string;
  cityId: string;
  authorProfileId: string;
  rating: number;
  title: string | null;
  comment: string | null;
  photoUrl: string | null;
  status: EntityStatus;
  replyOwner: string | null;
  replyAt: string | null;
  createdAt: string | null;
};

export type AttractionPhoto = {
  id: string;
  attractionId: string;
  cityId: string;
  authorProfileId: string;
  storagePath: string;
  mediaType: 'image' | 'video';
  caption: string | null;
  status: EntityStatus;
  createdAt: string | null;
};

export type AttractionService = {
  id: string;
  attractionId: string;
  kind: string;
  label: string;
  details: string | null;
  price: number | null;
  contactBusinessId: string | null;
};

export type FishingSpot = {
  id: string;
  cityId: string;
  slug: string;
  name: string;
  description: string | null;
  lat: number | null;
  lng: number | null;
  species: string[];
  regulations: string | null;
  defesoPeriod: string | null;
  requiresGuide: boolean;
  accessDifficulty: string | null;
  coverUrl: string | null;
  photos: string[];
  status: EntityStatus;
};

export type FishingGuide = {
  id: string;
  cityId: string;
  slug: string;
  fullName: string;
  licenseNumber: string | null;
  about: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  services: string[];
  priceRange: string | null;
  hasBoat: boolean;
  photoUrl: string | null;
  ownerProfileId: string | null;
  status: EntityStatus;
  verified: boolean;
  ogImageUrl?: string;
  ogSquareImageUrl?: string;
};

export type TourPackage = {
  id: string;
  cityId: string;
  providerBusinessId: string | null;
  slug: string;
  title: string;
  description: string | null;
  durationHours: number | null;
  price: number | null;
  includes: string[];
  contactPhone: string | null;
  contactWhatsapp: string | null;
  coverUrl: string | null;
  itinerary: unknown[];
  difficulty: string | null;
  totalDurationHours: number | null;
  totalDistanceKm: number | null;
  gallery: string[];
  featured: boolean;
  status: EntityStatus;
};

export type AttractionFull = Attraction & {
  reviews: AttractionReview[];
  publicPhotos: AttractionPhoto[];
  services: AttractionService[];
  relatedPackages: TourPackage[];
  averageRating: number | null;
};

export type GuideKind = 'distrito' | 'cidade' | 'tematico' | 'roteiro';

export type GuideHighlight = {
  icon: string;
  title: string;
  description: string;
};

export type GuideSection = {
  id: string;
  title: string;
  subtitle: string | null;
  content: string[] | null;
  items: GuideSectionItem[] | null;
  fares: GuideFare[] | null;
  warning: string | null;
  cta: { label: string; href: string } | null;
  date: { month: string; mainDay: string; period: string } | null;
  description: string | null;
  programHighlights: string[] | null;
  tips: string[] | null;
  seasons: GuideSeason[] | null;
  places: GuidePlace[] | null;
  experiences: GuideExperience[] | null;
};

export type GuideMediaKind = 'image' | 'video';

export type GuideSectionItem = {
  title: string;
  description: string;
  image: string | null;
  imageAssetId: string | null;
  alt: string | null;
  tags: string[];
  mediaKind: GuideMediaKind | null;
};

export type GuideExperience = {
  title: string;
  description: string;
  image: string | null;
  imageAssetId: string | null;
  alt: string | null;
  mediaKind: GuideMediaKind | null;
  duration: string | null;
  price: string | null;
  tags: string[];
  cta: { label: string; href: string } | null;
};

export type GuideFare = {
  type: string;
  price: string;
  note: string | null;
};

export type GuideSeason = {
  period: string;
  idealFor: string;
  description: string;
};

export type GuidePlace = {
  name: string;
  category: string;
  description: string;
  address: string | null;
  featured: boolean;
  needsVerification: boolean;
};

export type GuideFaqItem = {
  question: string;
  answer: string;
};

export type GuidePracticalItem = {
  title: string;
  text: string;
};

export type GuideContentBlock = {
  type: 'quote' | 'banner';
  title: string;
  text: string;
  button: { label: string; href: string } | null;
};

export type GuideLinkedEntity = {
  id: string;
  guideId: string;
  entityType: string;
  entityId: string;
  sortOrder: number;
  label: string | null;
  description: string | null;
};

export type GuideReview = {
  id: string;
  guideId: string;
  cityId: string;
  authorProfileId: string;
  rating: number;
  title: string | null;
  comment: string | null;
  photoUrl: string | null;
  visitDate: string | null;
  status: EntityStatus;
  replyOwner: string | null;
  replyAt: string | null;
  createdAt: string | null;
};

export type GuidePhoto = {
  id: string;
  guideId: string;
  cityId: string;
  authorProfileId: string;
  storagePath: string;
  caption: string | null;
  status: EntityStatus;
  createdAt: string | null;
};

export type TourismGuide = {
  id: string;
  cityId: string;
  slug: string;
  aliases: string[];
  kind: GuideKind;
  name: string;
  tagline: string | null;
  description: string | null;
  /** URL do YouTube para embed no hero da página pública do guia */
  youtubeUrl: string | null;
  coverUrl: string | null;
  photos: string[];
  googlePlaceId: string | null;
  googleMapsUrl: string | null;
  googleSummary: string | null;
  googlePhotos: GoogleAttractionPhoto[];
  googleReviews: GoogleAttractionReview[];
  address: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  whatsapp: string | null;
  website: string | null;
  instagram: string | null;
  sections: GuideSection[];
  seo: Record<string, unknown>;
  practicalInfo: GuidePracticalItem[];
  faq: GuideFaqItem[];
  highlights: GuideHighlight[];
  contentBlocks: GuideContentBlock[];
  rating: number | null;
  reviewsCount: number;
  ownerProfileId: string | null;
  status: EntityStatus;
  featured: boolean;
  ogImageUrl?: string;
  ogSquareImageUrl?: string;
};

export type GuideCdnMedia = {
  assetId: string;
  url: string;
  kind: GuideMediaKind;
  contentType: string | null;
  altText: string | null;
};

export type TourismGuideFull = TourismGuide & {
  reviews: GuideReview[];
  publicPhotos: GuidePhoto[];
  linkedEntities: GuideLinkedEntity[];
  cdnMedia: GuideCdnMedia[];
  averageRating: number | null;
};
