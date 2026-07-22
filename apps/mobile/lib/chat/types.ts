export type SearchEntityType =
  | 'business'
  | 'accommodation'
  | 'restaurant'
  | 'tourism_guide'
  | 'fishing_guide'
  | 'event'
  | 'classified'
  | 'property'
  | 'attraction'
  | 'tour_package'
  | 'emergency_contact'
  | 'health_facility'
  | 'site_page'
  | 'faq';

export type SearchHit = {
  entityType: SearchEntityType;
  entityId: string;
  score: number;
  title: string;
  subtitle: string | null;
  description: string | null;
  url: string;
  coverUrl: string | null;
};

export type AgentBlock =
  | { type: 'text'; text: string }
  | { type: 'fallback'; text: string }
  | {
      type: 'search_results';
      items: Array<{
        entity_type: string;
        entity_id: string;
        name: string;
        url: string | null;
        cover_url: string | null;
      }>;
    }
  | {
      type: 'entity_hours';
      entity: {
        name: string;
        entity_type: string;
        entity_id: string;
        slug: string | null;
        url: string | null;
      };
      is_open_now: boolean | null;
      status_label: string;
      hours: Array<{
        weekday: number | string;
        starts_at: string | null;
        ends_at: string | null;
        label: string;
        is_open_now?: boolean;
      }>;
    }
  | {
      type: 'entity_details';
      entity: {
        name: string;
        entity_type: string;
        entity_id: string;
        slug: string | null;
        url: string | null;
      };
      phone: string | null;
      whatsapp: string | null;
      address: string | null;
      instagram: string | null;
      services?: unknown[];
      attributes?: Record<string, unknown>;
    }
  | { type: 'faq'; items: Array<{ question: string; answer: string }> }
  | {
      type: 'events';
      items: Array<{
        title: string;
        slug: string | null;
        starts_at: string | null;
        location: string | null;
      }>;
    }
  | {
      type: 'news';
      items: Array<{ title: string; slug: string | null; excerpt: string | null }>;
    }
  | {
      type: 'garbage_schedule';
      items: Array<{
        day_of_week: number;
        type: string;
        start_time: string | null;
        end_time: string | null;
        notes: string | null;
        districts: Array<{ name: string }>;
      }>;
    }
  | {
      type: 'churches';
      items: Array<{
        id: string;
        name: string;
        tradition: string;
        address: string | null;
        phone: string | null;
        whatsapp: string | null;
        has_today: boolean;
        weekly_schedule: Array<{
          church_id: string;
          weekday: number;
          starts_at: string;
          ends_at: string | null;
          title: string;
          note: string | null;
          source_status: string;
          is_today: boolean;
        }>;
      }>;
    }
  | {
      type: 'ferry';
      items: Array<{
        slug: string;
        name: string;
        endpoints: string;
        status: string;
        fare_summary: string | null;
        fare_warning: string | null;
        schedules_by_direction: Record<string, Array<{ time: string; notes: string | null; isNext?: boolean }>>;
        alerts: Array<{ type: string; title: string; message: string }>;
        public_url: string;
        /** @deprecated presentes apenas em dados antigos em cache */
        full_name?: string;
        region?: string | null;
        confidence?: string;
        description?: string | null;
        fare?: number | null;
        important_info?: string | null;
        total_departures?: number;
      }>;
    }
  | { type: string; [key: string]: unknown };

export type CtaButton = {
  label: string;
  href: string;
  variant?: 'primary' | 'secondary';
};

export type StoredMessage = {
  role: 'user' | 'assistant';
  text: string | null;
  hits: SearchHit[];
  blocks?: AgentBlock[];
  cta?: CtaButton[];
  aiNotice?: { label: string; href: string | null } | null;
};

export type ChatSession = {
  id: string;
  title: string;
  messages: StoredMessage[];
  createdAt: number;
  updatedAt: number;
};

export type MessageFeedbackContext = {
  sessionLocalId: string;
  query: string;
  conversation: Array<{ role: 'user' | 'assistant'; text: string }>;
};

export type AssistantChatResult = {
  queryId: string | null;
  answer: string | null;
  hits: SearchHit[];
  blocks?: AgentBlock[];
  latencyMs: number;
  aiNotice?: { label: string; href: string | null };
  title?: string | null;
  cta?: CtaButton[];
};
