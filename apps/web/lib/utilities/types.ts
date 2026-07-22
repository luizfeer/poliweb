import type { Database } from '@/lib/supabase/database.types';

export type GarbageKind = Database['public']['Enums']['garbage_kind'];
export type AlertKind = Database['public']['Enums']['alert_kind'];

export type GarbageSchedule = {
  id: string;
  cityId: string;
  districtId: string;
  districtName: string;
  type: GarbageKind;
  dayOfWeek: number;
  startTime: string | null;
  endTime: string | null;
  notes: string | null;
  active: boolean;
};

export type GarbageScheduleByDay = Record<number, GarbageSchedule[]>;

export type EmergencyContact = {
  id: string;
  cityId: string;
  category: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  whatsapp: string | null;
  shortDial: string | null;
  description: string | null;
  whenToUse: string | null;
  hoursLegacyText: string | null;
  sourceType: string;
  tags: string[];
  needsVerification: boolean;
  note: string | null;
  lastVerifiedAt: string | null;
  displayOrder: number;
  active: boolean;
};

export type Pharmacy = {
  id: string;
  cityId: string;
  name: string;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  is24h: boolean;
  lat: number | null;
  lng: number | null;
  googleMapsUrl: string | null;
  active: boolean;
};

export type PharmacyShift = {
  id: string;
  pharmacyId: string;
  pharmacyName?: string;
  startDate: string;
  endDate: string;
  shiftType: 'plantao_24h' | 'noturno';
  notes: string | null;
};

export type HealthFacility = {
  id: string;
  cityId: string;
  slug: string | null;
  districtId: string | null;
  districtName: string | null;
  name: string;
  type: 'ubs' | 'hospital' | 'upa' | 'odonto' | 'psf' | 'caps' | 'secretaria' | 'farmacia-publica' | 'vacinacao' | 'vigilancia';
  neighborhood: string | null;
  address: string | null;
  phone: string | null;
  secondaryPhone: string | null;
  whatsapp: string | null;
  hoursLegacyText: string | null;
  services: string[];
  requirements: string[];
  sourceType: string;
  tags: string[];
  needsVerification: boolean;
  note: string | null;
  lastVerifiedAt: string | null;
  displayOrder: number;
  lat: number | null;
  lng: number | null;
  active: boolean;
};

export type HealthCampaign = {
  id: string;
  cityId: string;
  title: string;
  description: string | null;
  targetGroup: string | null;
  vaccineOrTopic: string | null;
  startAt: string | null;
  endAt: string | null;
  location: string | null;
  coverUrl: string | null;
  active: boolean;
};

export type ServiceAlert = {
  id: string;
  cityId: string;
  type: AlertKind;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string | null;
  affectedArea: string | null;
  affectedDistrictIds: string[];
  startAt: string;
  endAt: string | null;
  source: string | null;
  sourceUrl: string | null;
  active: boolean;
};
