export type ChurchTradition = 'catolica' | 'evangelica' | 'adventista' | 'outra';

export type WeekdayKey = 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado' | 'domingo';

export type ChurchScheduleItem = {
  id: string;
  churchSlug: string;
  weekday: WeekdayKey;
  time: string;
  title: string;
  note: string | null;
  sourceStatus: 'confirmed' | 'needs_verification';
};

export type Church = {
  id: string;
  slug: string;
  name: string;
  tradition: ChurchTradition;
  neighborhood: string | null;
  address: string | null;
  googleMapsUrl?: string | null;
  coverUrl?: string | null;
  logoUrl?: string | null;
  photos?: ChurchPhoto[];
  pastorName: string | null;
  phone: string | null;
  instagram: string | null;
  shortDescription: string;
  claimed: boolean;
  featured: boolean;
  rating?: number;
  reviewsCount?: number;
  ogImageUrl?: string;
  ogSquareImageUrl?: string;
};

export type ChurchPhoto = {
  src: string;
  attribution: string | null;
  contentType?: string | null;
};

export type ChurchReview = {
  id: string;
  churchId: string;
  authorName?: string;
  rating: number;
  title?: string;
  comment?: string;
  replyOwner?: string;
  replyAt?: string;
  createdAt?: string;
};
