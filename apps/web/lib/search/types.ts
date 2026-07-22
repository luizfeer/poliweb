import type { AgentBlock, CtaButton } from '@/lib/ai/city-agent-client';
import type { HoursStatus } from '@/lib/hours/types';

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
  phone?: string | null;
  whatsapp?: string | null;
  source: 'semantic' | 'fulltext';
};

export type SearchResult = {
  queryId: string | null;
  hits: SearchHit[];
  latencyMs: number;
  usedFallback: boolean;
};

export type ChatMessage = {
  role: 'user' | 'assistant';
  text: string | null;
  hits: SearchHit[];
  blocks?: AgentBlock[];
  aiNotice?: {
    label: string;
    href: string | null;
  };
  entityStatus?: {
    entityType: string;
    entityId: string;
    name: string;
    status: HoursStatus;
  };
  entityDetails?: {
    entityType: string;
    entityId: string;
    name: string;
    services?: unknown[];
    attributes?: Record<string, unknown>;
    contact?: Record<string, unknown>;
  };
};

export type ChatResult = {
  queryId: string | null;
  answer: string | null;
  hits: SearchHit[];
  blocks?: AgentBlock[];
  latencyMs: number;
  aiNotice?: {
    label: string;
    href: string | null;
  };
  entityStatus?: ChatMessage['entityStatus'];
  entityDetails?: ChatMessage['entityDetails'];
  /** Título sugerido pela IA quando é a 1ª mensagem da sessão */
  title?: string | null;
  /** Botões de ação que apontam para páginas relevantes do site */
  cta?: CtaButton[];
};

export type MatchEmbeddingRow = {
  entity_type: SearchEntityType;
  entity_id: string;
  score: number;
};
