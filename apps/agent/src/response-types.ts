export type AgentResponseBlock =
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
      services: any[];
      attributes: Record<string, any>;
    }
  | { type: 'faq'; items: FaqItem[] }
  | { type: 'news'; items: NewsItem[] }
  | { type: 'events'; items: EventItem[] }
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

export type ConversationMessage = {
  role: 'user' | 'assistant';
  text: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

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

export type FerryResultItem = {
  slug: string;
  name: string;
  endpoints: string;
  status: string;
  fare_summary: string | null;
  fare_warning: string | null;
  schedules_by_direction: Record<
    string,
    Array<{ time: string; notes: string | null; isNext?: boolean }>
  >;
  alerts: Array<{ type: string; title: string; message: string }>;
  public_url: string;
  /** @deprecated campos pesados removidos do bloco armazenado — presentes apenas no output bruto da tool */
  full_name?: string;
  region?: string | null;
  confidence?: string;
  description?: string | null;
  fare?: number | null;
  important_info?: string | null;
  total_departures?: number;
};

export type CtaButton = {
  label: string;
  href: string;
  variant?: 'primary' | 'secondary';
};

export type AgentResponse = {
  blocks: AgentResponseBlock[];
  fallback: boolean;
  intent: string;
  model: string;
  /** Título curto da conversa, gerado quando isFirstMessage=true */
  title?: string | null;
  /** Botões de ação que apontam pra páginas relevantes do site */
  cta?: CtaButton[];
};
