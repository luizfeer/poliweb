import 'server-only';

import type { CityAgentIntent } from './intent';

export type AgentBlock =
  | { type: 'text'; text: string }
  | { type: 'search_results'; items: SearchResultItem[] }
  | {
      type: 'entity_hours';
      entity: EntityRef;
      is_open_now: boolean | null;
      hours: HourEntry[];
      status_label: string;
    }
  | {
      type: 'entity_details';
      entity: EntityRef;
      phone: string | null;
      whatsapp: string | null;
      address: string | null;
      instagram: string | null;
      services: unknown[];
      attributes: Record<string, unknown>;
    }
  | { type: 'faq'; items: FaqItem[] }
  | { type: 'news'; items: NewsItem[] }
  | { type: 'events'; items: EventItem[] }
  | { type: 'churches'; items: ChurchResultItem[] }
  | { type: 'garbage_schedule'; items: GarbageScheduleItem[] }
  | { type: 'ferry'; items: FerryResultItem[] }
  | { type: 'fallback'; text: string };

export type SearchResultItem = {
  entity_type: string;
  entity_id: string;
  name: string;
  url: string | null;
  cover_url: string | null;
  score?: number;
};

export type EntityRef = {
  name: string;
  entity_type: string;
  entity_id: string;
  slug: string | null;
  url: string | null;
};

export type HourEntry = {
  weekday: number | string;
  starts_at: string | null;
  ends_at: string | null;
  label: string;
  is_open_now?: boolean;
};

export type FaqItem = { question: string; answer: string };
export type NewsItem = {
  title: string;
  slug: string | null;
  excerpt: string | null;
  cover_url: string | null;
  published_at: string | null;
};
export type EventItem = {
  title: string;
  slug: string | null;
  starts_at: string | null;
  ends_at: string | null;
  location: string | null;
  cover_url: string | null;
};

export type GarbageScheduleItem = {
  day_of_week: number;
  type: string;
  start_time: string | null;
  end_time: string | null;
  notes: string | null;
  districts: Array<{ name: string }>;
};

export type ChurchScheduleAgentItem = {
  church_id: string;
  weekday: number;
  starts_at: string;
  ends_at: string | null;
  title: string;
  note: string | null;
  source_status: string;
  is_today: boolean;
};

export type ChurchResultItem = {
  id: string;
  name: string;
  tradition: string;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  weekly_schedule: ChurchScheduleAgentItem[];
  has_today: boolean;
};

export type FerryResultItem = {
  slug: string;
  name: string;
  full_name: string;
  region: string | null;
  endpoints: string;
  status: string;
  confidence: string;
  description: string | null;
  fare_summary: string | null;
  fare_warning: string | null;
  fare: number | null;
  important_info: string | null;
  schedules_by_direction: Record<
    string,
    Array<{ time: string; notes: string | null; isNext?: boolean }>
  >;
  total_departures: number;
  alerts: Array<{ type: string; title: string; message: string }>;
  public_url: string;
};

export type CtaButton = {
  label: string;
  href: string;
  variant?: 'primary' | 'secondary';
};

export type CityAgentResponse = {
  blocks: AgentBlock[];
  fallback: boolean;
  intent: CityAgentIntent;
  model: string;
  title: string | null;
  cta: CtaButton[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function nullableString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function parseChurchScheduleItem(value: unknown): ChurchScheduleAgentItem | null {
  if (!isRecord(value)) return null;
  const churchId = nullableString(value.church_id);
  const weekday = typeof value.weekday === 'number' ? value.weekday : null;
  const startsAt = nullableString(value.starts_at);
  const title = nullableString(value.title);
  if (!churchId || weekday === null || !startsAt || !title) return null;

  return {
    church_id: churchId,
    weekday,
    starts_at: startsAt,
    ends_at: nullableString(value.ends_at),
    title,
    note: nullableString(value.note),
    source_status: nullableString(value.source_status) ?? 'needs_verification',
    is_today: value.is_today === true,
  };
}

function parseChurchItems(value: unknown): ChurchResultItem[] | null {
  if (!Array.isArray(value)) return null;
  const items = value
    .map((item): ChurchResultItem | null => {
      if (!isRecord(item)) return null;
      const id = nullableString(item.id);
      const name = nullableString(item.name);
      const tradition = nullableString(item.tradition);
      if (!id || !name || !tradition) return null;

      return {
        id,
        name,
        tradition,
        address: nullableString(item.address),
        phone: nullableString(item.phone),
        whatsapp: nullableString(item.whatsapp),
        weekly_schedule: Array.isArray(item.weekly_schedule)
          ? item.weekly_schedule
              .map(parseChurchScheduleItem)
              .filter((schedule): schedule is ChurchScheduleAgentItem => schedule !== null)
          : [],
        has_today: item.has_today === true,
      };
    })
    .filter((item): item is ChurchResultItem => item !== null);

  return items.length > 0 ? items : null;
}

function parseChurchItemsFromText(text: string): ChurchResultItem[] | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith('[') && !trimmed.startsWith('{')) return null;

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    return parseChurchItems(parsed);
  } catch {
    return null;
  }
}

function parseGarbageScheduleItems(value: unknown): GarbageScheduleItem[] | null {
  if (!Array.isArray(value)) return null;

  const items = value
    .map((item): GarbageScheduleItem | null => {
      if (!isRecord(item)) return null;
      const dayOfWeek = typeof item.day_of_week === 'number' ? item.day_of_week : null;
      if (dayOfWeek === null) return null;

      const districtsValue = item.districts;
      const districts = Array.isArray(districtsValue)
        ? districtsValue
            .map((district) => {
              if (!isRecord(district)) return null;
              const name = nullableString(district.name);
              return name ? { name } : null;
            })
            .filter((district): district is { name: string } => district !== null)
        : isRecord(districtsValue)
          ? (() => {
              const name = nullableString(districtsValue.name);
              return name ? [{ name }] : [];
            })()
          : [];

      return {
        day_of_week: dayOfWeek,
        type: nullableString(item.type) ?? 'common',
        start_time: nullableString(item.start_time),
        end_time: nullableString(item.end_time),
        notes: nullableString(item.notes),
        districts,
      };
    })
    .filter((item): item is GarbageScheduleItem => item !== null);

  return items.length > 0 ? items : null;
}

function parseGarbageScheduleItemsFromText(text: string): GarbageScheduleItem[] | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith('[') && !trimmed.startsWith('{')) return null;

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    return parseGarbageScheduleItems(parsed);
  } catch {
    return null;
  }
}

function normalizeAgentBlocks(value: unknown): AgentBlock[] {
  if (!Array.isArray(value)) return [];

  const rawChurchItems = parseChurchItems(value);
  if (rawChurchItems) return [{ type: 'churches', items: rawChurchItems }];

  return value
    .map((block): AgentBlock | null => {
      if (!isRecord(block)) return null;

      const type = nullableString(block.type);
      if (type === 'text') {
        const text = nullableString(block.text);
        if (!text) return null;
        const churchItems = parseChurchItemsFromText(text);
        if (churchItems) return { type: 'churches', items: churchItems };
        const garbageItems = parseGarbageScheduleItemsFromText(text);
        if (garbageItems) return { type: 'garbage_schedule', items: garbageItems };
        return { type: 'text', text };
      }

      if (type === 'churches') {
        const churchItems = parseChurchItems(block.items);
        return churchItems ? { type: 'churches', items: churchItems } : null;
      }

      if (type === 'garbage_schedule') {
        const garbageItems = parseGarbageScheduleItems(block.items);
        return garbageItems ? { type: 'garbage_schedule', items: garbageItems } : null;
      }

      if (
        type === 'search_results' ||
        type === 'entity_hours' ||
        type === 'entity_details' ||
        type === 'faq' ||
        type === 'news' ||
        type === 'events' ||
        type === 'ferry' ||
        type === 'fallback'
      ) {
        return block as AgentBlock;
      }

      return null;
    })
    .filter((block): block is AgentBlock => block !== null);
}

export async function askCityAgent(input: {
  citySlug: string;
  query: string;
  profileId?: string | null;
  conversation?: Array<{ role: 'user' | 'assistant'; text: string }>;
  pageContext?: string | null;
  isFirstMessage?: boolean;
}): Promise<CityAgentResponse | null> {
  const baseUrl = process.env.CITY_AGENT_URL;
  if (!baseUrl) return null;

  const response = await fetch(
    `${baseUrl.replace(/\/$/, '')}/v1/cities/${encodeURIComponent(input.citySlug)}/ask`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(process.env.CITY_AGENT_TOKEN
          ? { authorization: `Bearer ${process.env.CITY_AGENT_TOKEN}` }
          : {}),
      },
      body: JSON.stringify({
        query: input.query,
        profileId: input.profileId ?? null,
        channel: 'web',
        conversation: input.conversation ?? [],
        pageContext: input.pageContext ?? null,
        isFirstMessage: input.isFirstMessage ?? (input.conversation ?? []).length === 0,
      }),
      cache: 'no-store',
    },
  );

  if (!response.ok) return null;

  const payload = (await response.json()) as unknown;
  if (!payload || typeof payload !== 'object') return null;

  const maybe = payload as Partial<CityAgentResponse>;

  const ctaIn = Array.isArray(maybe.cta) ? maybe.cta : [];
  const cta: CtaButton[] = ctaIn
    .filter(
      (b): b is CtaButton =>
        !!b &&
        typeof b === 'object' &&
        typeof (b as CtaButton).label === 'string' &&
        typeof (b as CtaButton).href === 'string' &&
        (b as CtaButton).href.startsWith('/'),
    )
    .slice(0, 5);

  return {
    blocks: normalizeAgentBlocks(maybe.blocks),
    fallback: maybe.fallback === true,
    intent: maybe.intent ?? 'generic',
    model: typeof maybe.model === 'string' ? maybe.model : 'unknown',
    title: typeof maybe.title === 'string' && maybe.title.trim() ? maybe.title.trim() : null,
    cta,
  };
}
