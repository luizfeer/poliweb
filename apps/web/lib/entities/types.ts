export type EntityType =
  | 'business'
  | 'restaurant'
  | 'accommodation'
  | 'attraction'
  | 'utility'
  | 'emergency_contact'
  | 'health_facility';

export type EntityService = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number | null;
  durationMin: number | null;
  requirements: string | null;
};

export type EntityFaq = {
  id: string;
  question: string;
  answer: string;
};

export type EntityAttributes = Record<string, boolean | string | number | null>;
