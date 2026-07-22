import 'server-only';

import { getCurrentCity } from '@/lib/cities';
import { createClient } from '@/lib/supabase/server';
import { publicCached } from '@/lib/cache/public-query';
import type {
  EmergencyContact,
  GarbageSchedule,
  GarbageScheduleByDay,
  HealthCampaign,
  HealthFacility,
  Pharmacy,
  PharmacyShift,
  ServiceAlert,
} from './types';

type DistrictRow = { name: string | null };

type GarbageRow = {
  id: string;
  city_id: string;
  district_id: string;
  districts?: DistrictRow | null;
  type: GarbageSchedule['type'] | null;
  day_of_week: number;
  start_time: string | null;
  end_time: string | null;
  notes: string | null;
  active: boolean | null;
};

type PharmacyRow = {
  id: string;
  city_id: string;
  name: string;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  is_24h: boolean | null;
  lat: number | null;
  lng: number | null;
  google_maps_url: string | null;
  active: boolean | null;
};

type HealthFacilityRow = {
  id: string;
  city_id: string;
  slug?: string | null;
  district_id: string | null;
  districts?: DistrictRow | null;
  name: string;
  type: HealthFacility['type'];
  neighborhood?: string | null;
  address: string | null;
  phone: string | null;
  secondary_phone?: string | null;
  whatsapp?: string | null;
  hours_legacy_text: string | null;
  services: unknown;
  requirements?: unknown;
  source_type?: string | null;
  tags?: unknown;
  needs_verification?: boolean | null;
  note?: string | null;
  last_verified_at?: string | null;
  display_order?: number | null;
  lat: number | null;
  lng: number | null;
  active: boolean | null;
};

const healthFacilitySelect =
  'id, city_id, slug, district_id, name, type, neighborhood, address, phone, secondary_phone, whatsapp, hours_legacy_text, services, requirements, source_type, tags, needs_verification, note, last_verified_at, display_order, lat, lng, active, districts(name)';

type EmergencyContactRow = {
  id: string;
  city_id: string;
  category: string;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  whatsapp: string | null;
  short_dial: string | null;
  description: string | null;
  when_to_use?: string | null;
  hours_legacy_text: string | null;
  source_type?: string | null;
  tags?: unknown;
  needs_verification?: boolean | null;
  note?: string | null;
  last_verified_at?: string | null;
  display_order: number | null;
  active: boolean | null;
};

const emergencyContactSelect =
  'id, city_id, category, name, phone, email, address, whatsapp, short_dial, description, when_to_use, hours_legacy_text, source_type, tags, needs_verification, note, last_verified_at, display_order, active';

async function getCityId(cityId?: string): Promise<string | null> {
  if (cityId) return cityId;
  const city = await getCurrentCity();
  return city?.id ?? null;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function toGarbageSchedule(row: GarbageRow): GarbageSchedule {
  return {
    id: row.id,
    cityId: row.city_id,
    districtId: row.district_id,
    districtName: row.districts?.name ?? 'Bairro',
    type: row.type ?? 'common',
    dayOfWeek: row.day_of_week,
    startTime: row.start_time,
    endTime: row.end_time,
    notes: row.notes,
    active: row.active ?? false,
  };
}

function toPharmacy(row: PharmacyRow): Pharmacy {
  return {
    id: row.id,
    cityId: row.city_id,
    name: row.name,
    address: row.address,
    phone: row.phone,
    whatsapp: row.whatsapp,
    is24h: row.is_24h ?? false,
    lat: row.lat,
    lng: row.lng,
    googleMapsUrl: row.google_maps_url,
    active: row.active ?? false,
  };
}

function toHealthFacility(row: HealthFacilityRow): HealthFacility {
  return {
    id: row.id,
    cityId: row.city_id,
    slug: row.slug ?? null,
    districtId: row.district_id,
    districtName: row.districts?.name ?? null,
    name: row.name,
    type: row.type,
    neighborhood: row.neighborhood ?? null,
    address: row.address,
    phone: row.phone,
    secondaryPhone: row.secondary_phone ?? null,
    whatsapp: row.whatsapp ?? null,
    hoursLegacyText: row.hours_legacy_text,
    services: asStringArray(row.services),
    requirements: asStringArray(row.requirements),
    sourceType: row.source_type ?? 'oficial',
    tags: asStringArray(row.tags),
    needsVerification: row.needs_verification ?? false,
    note: row.note ?? null,
    lastVerifiedAt: row.last_verified_at ?? null,
    displayOrder: row.display_order ?? 0,
    lat: row.lat,
    lng: row.lng,
    active: row.active ?? false,
  };
}

export async function getGarbageSchedule(params: {
  city_id?: string;
  district_id?: string;
} = {}): Promise<GarbageScheduleByDay> {
  const cityId = await getCityId(params.city_id);
  if (!cityId) return { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };

  return publicCached(
    {
      key: 'garbage:schedule',
      tags: ['garbage', `garbage:${cityId}`],
      parts: [cityId, params.district_id ?? ''],
    },
    async (supabase) => {
      let query = supabase
        .from('garbage_schedules')
        .select('id, city_id, district_id, type, day_of_week, start_time, end_time, notes, active, districts(name)')
        .eq('city_id', cityId)
        .eq('active', true)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (params.district_id) query = query.eq('district_id', params.district_id);

      const { data, error } = await query;
      if (error) return { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };

      return ((data ?? []) as unknown as GarbageRow[])
        .map(toGarbageSchedule)
        .reduce<GarbageScheduleByDay>(
          (acc, item) => {
            acc[item.dayOfWeek] = [...(acc[item.dayOfWeek] ?? []), item];
            return acc;
          },
          { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] },
        );
    },
  );
}

export async function listEmergencyContacts(params: {
  city_id?: string;
  category?: string;
  includeInactive?: boolean;
} = {}): Promise<EmergencyContact[]> {
  const cityId = await getCityId(params.city_id);
  if (!cityId) return [];

  // includeInactive é caso de admin — não cacheia.
  if (params.includeInactive) {
    const supabase = await createClient();
    let query = supabase
      .from('emergency_contacts')
      .select(emergencyContactSelect)
      .eq('city_id', cityId)
      .order('category', { ascending: true })
      .order('display_order', { ascending: true });
    if (params.category) query = query.eq('category', params.category);
    const { data, error } = await query;
    if (error) return [];
    return ((data ?? []) as unknown as EmergencyContactRow[]).map(mapEmergencyContact);
  }

  return publicCached(
    {
      key: 'utilities:contacts:v2',
      tags: ['utilities', `utilities:${cityId}`],
      revalidate: 60,
      parts: [cityId, params.category ?? ''],
    },
    async (supabase) => {
      let query = supabase
        .from('emergency_contacts')
        .select(emergencyContactSelect)
        .eq('city_id', cityId)
        .eq('active', true)
        .order('category', { ascending: true })
        .order('display_order', { ascending: true });
      if (params.category) query = query.eq('category', params.category);
      const { data, error } = await query;
      if (error) return [];
      return ((data ?? []) as unknown as EmergencyContactRow[]).map(mapEmergencyContact);
    },
  );
}

function mapEmergencyContact(row: EmergencyContactRow): EmergencyContact {
  return {
    id: row.id,
    cityId: row.city_id,
    category: row.category,
    name: row.name,
    phone: row.phone,
    email: row.email ?? null,
    address: row.address ?? null,
    whatsapp: row.whatsapp,
    shortDial: row.short_dial,
    description: row.description,
    whenToUse: row.when_to_use ?? null,
    hoursLegacyText: row.hours_legacy_text,
    sourceType: row.source_type ?? 'oficial',
    tags: asStringArray(row.tags),
    needsVerification: row.needs_verification ?? false,
    note: row.note ?? null,
    lastVerifiedAt: row.last_verified_at ?? null,
    displayOrder: row.display_order ?? 0,
    active: row.active ?? false,
  };
}

export async function getPharmacyOnDuty(params: {
  city_id?: string;
  date?: string;
} = {}): Promise<Pharmacy[]> {
  const cityId = await getCityId(params.city_id);
  if (!cityId) return [];

  const date = params.date ?? new Date().toISOString().slice(0, 10);

  return publicCached(
    {
      key: 'utilities:pharmacy-duty',
      tags: ['utilities', `utilities:${cityId}`, 'pharmacy-duty'],
      revalidate: 1800,
      parts: [cityId, date],
    },
    async (supabase) => {
      const { data, error } = await supabase.rpc('current_pharmacy_on_duty', {
        p_city_id: cityId,
        p_date: date,
      });
      if (error) return [];
      return ((data ?? []) as unknown as PharmacyRow[]).map(toPharmacy);
    },
  );
}

export async function listPharmacies(params: {
  city_id?: string;
  includeInactive?: boolean;
} = {}): Promise<Pharmacy[]> {
  const cityId = await getCityId(params.city_id);
  if (!cityId) return [];

  if (params.includeInactive) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('pharmacies')
      .select('id, city_id, name, address, phone, whatsapp, is_24h, lat, lng, google_maps_url, active')
      .eq('city_id', cityId)
      .order('name', { ascending: true });
    if (error) return [];
    return ((data ?? []) as PharmacyRow[]).map(toPharmacy);
  }

  return publicCached(
    {
      key: 'utilities:pharmacies',
      tags: ['utilities', `utilities:${cityId}`],
      parts: [cityId],
    },
    async (supabase) => {
      const { data, error } = await supabase
        .from('pharmacies')
        .select('id, city_id, name, address, phone, whatsapp, is_24h, lat, lng, google_maps_url, active')
        .eq('city_id', cityId)
        .eq('active', true)
        .order('name', { ascending: true });
      if (error) return [];
      return ((data ?? []) as PharmacyRow[]).map(toPharmacy);
    },
  );
}

export async function listPharmacyShifts(params: { city_id: string; pharmacy_id?: string }): Promise<PharmacyShift[]> {
  const supabase = await createClient();
  let query = supabase
    .from('pharmacy_shifts')
    .select('id, pharmacy_id, start_date, end_date, shift_type, notes, pharmacies!inner(id, city_id, name)')
    .eq('pharmacies.city_id', params.city_id)
    .order('start_date', { ascending: true });
  if (params.pharmacy_id) query = query.eq('pharmacy_id', params.pharmacy_id);
  const { data, error } = await query;
  if (error) return [];

  return ((data ?? []) as unknown as Array<{
    id: string;
    pharmacy_id: string;
    start_date: string;
    end_date: string;
    shift_type: 'plantao_24h' | 'noturno' | null;
    notes: string | null;
    pharmacies: { name: string | null } | null;
  }>).map((row) => ({
    id: row.id,
    pharmacyId: row.pharmacy_id,
    pharmacyName: row.pharmacies?.name ?? undefined,
    startDate: row.start_date,
    endDate: row.end_date,
    shiftType: row.shift_type ?? 'plantao_24h',
    notes: row.notes,
  }));
}

export async function listHealthFacilities(params: {
  city_id?: string;
  type?: HealthFacility['type'];
  district_id?: string;
  includeInactive?: boolean;
} = {}): Promise<HealthFacility[]> {
  const cityId = await getCityId(params.city_id);
  if (!cityId) return [];

  if (params.includeInactive) {
    const supabase = await createClient();
    let query = supabase
      .from('health_facilities')
      .select(healthFacilitySelect)
      .eq('city_id', cityId)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });
    if (params.type) query = query.eq('type', params.type);
    if (params.district_id) query = query.eq('district_id', params.district_id);
    const { data, error } = await query;
    if (error) return [];
    return ((data ?? []) as unknown as HealthFacilityRow[]).map(toHealthFacility);
  }

  return publicCached(
    {
      key: 'utilities:health-facilities:v3',
      tags: ['utilities', `utilities:${cityId}`, `health:${cityId}`],
      revalidate: 60,
      parts: [cityId, params.type ?? '', params.district_id ?? ''],
    },
    async (supabase) => {
      let query = supabase
        .from('health_facilities')
        .select(healthFacilitySelect)
        .eq('city_id', cityId)
        .eq('active', true)
        .order('display_order', { ascending: true })
        .order('name', { ascending: true });
      if (params.type) query = query.eq('type', params.type);
      if (params.district_id) query = query.eq('district_id', params.district_id);
      const { data, error } = await query;
      if (error) return [];
      return ((data ?? []) as unknown as HealthFacilityRow[]).map(toHealthFacility);
    },
  );
}

type HealthCampaignRow = {
  id: string;
  city_id: string;
  title: string;
  description: string | null;
  target_group: string | null;
  vaccine_or_topic: string | null;
  start_at: string | null;
  end_at: string | null;
  location: string | null;
  cover_url: string | null;
  active: boolean | null;
};

function toHealthCampaign(row: HealthCampaignRow): HealthCampaign {
  return {
    id: row.id,
    cityId: row.city_id,
    title: row.title,
    description: row.description,
    targetGroup: row.target_group,
    vaccineOrTopic: row.vaccine_or_topic,
    startAt: row.start_at,
    endAt: row.end_at,
    location: row.location,
    coverUrl: row.cover_url,
    active: row.active ?? false,
  };
}

export async function listHealthCampaigns(params: {
  city_id?: string;
  includeInactive?: boolean;
} = {}): Promise<HealthCampaign[]> {
  const cityId = await getCityId(params.city_id);
  if (!cityId) return [];

  if (params.includeInactive) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('health_campaigns')
      .select('id, city_id, title, description, target_group, vaccine_or_topic, start_at, end_at, location, cover_url, active')
      .eq('city_id', cityId)
      .order('start_at', { ascending: false, nullsFirst: false });
    if (error) return [];
    return ((data ?? []) as HealthCampaignRow[]).map(toHealthCampaign);
  }

  return publicCached(
    {
      key: 'utilities:health-campaigns',
      tags: ['utilities', `utilities:${cityId}`, `health:${cityId}`],
      parts: [cityId],
    },
    async (supabase) => {
      const { data, error } = await supabase
        .from('health_campaigns')
        .select('id, city_id, title, description, target_group, vaccine_or_topic, start_at, end_at, location, cover_url, active')
        .eq('city_id', cityId)
        .eq('active', true)
        .order('start_at', { ascending: false, nullsFirst: false });
      if (error) return [];
      return ((data ?? []) as HealthCampaignRow[]).map(toHealthCampaign);
    },
  );
}

type ServiceAlertRow = {
  id: string;
  city_id: string;
  type: ServiceAlert['type'];
  severity: ServiceAlert['severity'] | null;
  title: string;
  description: string | null;
  affected_area: string | null;
  affected_district_ids: string[] | null;
  start_at: string | null;
  end_at: string | null;
  source: string | null;
  source_url: string | null;
  active: boolean | null;
};

function toServiceAlert(row: ServiceAlertRow): ServiceAlert {
  return {
    id: row.id,
    cityId: row.city_id,
    type: row.type,
    severity: (row.severity ?? 'info') as ServiceAlert['severity'],
    title: row.title,
    description: row.description,
    affectedArea: row.affected_area,
    affectedDistrictIds: row.affected_district_ids ?? [],
    startAt: row.start_at ?? '',
    endAt: row.end_at,
    source: row.source,
    sourceUrl: row.source_url,
    active: row.active ?? false,
  };
}

export async function listActiveAlerts(params: {
  city_id?: string;
  includeRecentResolved?: boolean;
} = {}): Promise<ServiceAlert[]> {
  const cityId = await getCityId(params.city_id);
  if (!cityId) return [];

  // includeRecentResolved depende de `new Date()` no servidor → não cacheia.
  // Para listagem pura de ativos, o `end_at.gt.<now>` é arredondado por hora
  // pra ter chave de cache estável.
  if (params.includeRecentResolved) {
    const supabase = await createClient();
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const { data, error } = await supabase
      .from('service_alerts')
      .select('id, city_id, type, severity, title, description, affected_area, affected_district_ids, start_at, end_at, source, source_url, active')
      .eq('city_id', cityId)
      .or(`active.eq.true,end_at.gte.${since.toISOString()}`)
      .order('start_at', { ascending: false });
    if (error) return [];
    return ((data ?? []) as ServiceAlertRow[]).map(toServiceAlert);
  }

  // Arredonda pra próxima hora cheia: cache fica estável por até 1 hora,
  // mas o filtro `end_at.gt.<hora>` continua honesto.
  const now = new Date();
  now.setMinutes(0, 0, 0);
  const hourBucket = now.toISOString();

  return publicCached(
    {
      key: 'utilities:alerts',
      tags: ['utilities', `utilities:${cityId}`, `alerts:${cityId}`],
      revalidate: 300,
      parts: [cityId, hourBucket],
    },
    async (supabase) => {
      const { data, error } = await supabase
        .from('service_alerts')
        .select('id, city_id, type, severity, title, description, affected_area, affected_district_ids, start_at, end_at, source, source_url, active')
        .eq('city_id', cityId)
        .eq('active', true)
        .or(`end_at.is.null,end_at.gt.${hourBucket}`)
        .order('start_at', { ascending: false });
      if (error) return [];
      return ((data ?? []) as ServiceAlertRow[]).map(toServiceAlert);
    },
  );
}
