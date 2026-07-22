export type FerryStatus =
  | 'active'
  | 'active_check_before_go'
  | 'schedule_missing'
  | 'suspended'
  | 'inactive';

export type FerryConfidence = 'high' | 'medium' | 'low' | 'route_confirmed_schedule_missing';

export type FerryAlertType = 'info' | 'warning' | 'maintenance' | 'event' | 'safety';

export type FerryPrice = {
  category: string;
  price?: number;
  priceRange?: { min: number; max: number };
  label: string;
  description?: string;
};

export type FerryFare = {
  currency?: string;
  isFreeForResidents?: boolean;
  freeFor?: string[];
  paidFor?: string[];
  referenceTitle?: string;
  referenceDescription?: string;
  residentExemption?: string;
  inheritsReference?: string;
  referenceSummary?: string;
  prices?: FerryPrice[];
};

export type FerrySource = {
  tipo?: string;
  titulo?: string;
  municipio?: string;
};

export type FerryDisplay = {
  cardTitle?: string;
  cardSubtitle?: string;
  priceLabel?: string;
  scheduleLabel?: string;
  ctaLabel?: string;
};

export type FerrySchedule = {
  id: string;
  direction: string;
  origin: string | null;
  destination: string | null;
  departsAt: string;
  notes: string | null;
  displayOrder: number;
};

export type FerryAlert = {
  id: string;
  type: FerryAlertType;
  title: string;
  message: string;
};

export type FerryRouteCard = {
  id: string;
  slug: string;
  name: string;
  shortName: string | null;
  region: string | null;
  district: string | null;
  status: FerryStatus;
  confidence: FerryConfidence;
  description: string | null;
  fareSummary: string | null;
  display: FerryDisplay;
  endpointA: string | null;
  endpointB: string | null;
  relatedCities: string[];
  operatingDays: string[];
  featured: boolean;
  ogImageUrl?: string;
  ogSquareImageUrl?: string;
};

export type FerryRouteDetail = FerryRouteCard & {
  fareWarning: string | null;
  fare: FerryFare;
  importantInfo: string[];
  keywords: string[];
  source: FerrySource;
  schedules: FerrySchedule[];
  alerts: FerryAlert[];
  seo: { title?: string; description?: string };
};
