export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type JobName =
  | 'scrape:diario'
  | 'scrape:atas'
  | 'scrape:licitacoes'
  | 'scrape:noticias-camara'
  | 'scrape:noticias-prefeitura'
  | 'scrape:proposicoes'
  | 'scrape:all'
  | 'import:cliqueiachei-businesses'
  | 'import:google-business-photos'
  | 'import:google-attraction-photos'
  | 'estimate:ia'
  | 'summarize:pending'
  | 'embed:pending'
  | 'indexing:semantic'
  | 'moderate:backlog'
  | 'weather:update'
  | 'road-routes:update'
  | 'reindex:tourism'
  | 'analytics:aggregate'
  | 'og:pending'
  | 'email:dispatch-bridge'
  | 'push:deliveries'
  | 'business:trial-nudges'
  | 'media:sweep-orphans';

export type JobCounters = {
  processed: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: string[];
};

export type JobResult = JobCounters & {
  ok: boolean;
};

export type SourceName =
  | 'diario-oficial'
  | 'atas-camara'
  | 'licitacoes'
  | 'noticias-camara'
  | 'noticias-prefeitura'
  | 'proposicoes-camara';

export type ScrapedItemBase = {
  sourceName: SourceName;
  sourceUrl: string;
  sourceHost: string;
  scrapedAt: string;
  publishedAt: string | null;
  title: string;
  rawText: string;
  rawHtmlExcerpt: string;
  checksum: string;
  parseConfidence: number;
  parserWarnings: string[];
};

export type DiaryActCategory =
  | 'lei'
  | 'decreto'
  | 'portaria'
  | 'resolucao'
  | 'edital'
  | 'extrato'
  | 'chamamento'
  | 'licitacao'
  | 'nomeacao'
  | 'convenio'
  | 'termo_aditivo'
  | 'processo_seletivo'
  | 'outros';

export type DiaryEdition = ScrapedItemBase & {
  kind: 'diary-edition';
  editionNumber: string | null;
  detailUrl: string;
  downloadUrl: string | null;
  pageCount: number | null;
  fileSize: string | null;
  actType: DiaryActCategory;
  flaggedSuspected: boolean;
};

export type CouncilMeeting = ScrapedItemBase & {
  kind: 'council-meeting';
  meetingType: string | null;
  meetingNumber: string | null;
  legislature: string | null;
  sessionLabel: string | null;
  startedAt: string | null;
  detailUrl: string;
  topics: CouncilTopicInput[];
};

export type CouncilTopicInput = {
  title: string;
  authorCouncilor: string | null;
  topicType: string | null;
  summary: string | null;
  voteResult: string | null;
};

export type PublicTender = ScrapedItemBase & {
  kind: 'public-tender';
  bidNumber: string | null;
  processNumber: string | null;
  modality: string | null;
  status: string;
  objectSummary: string;
  postedAt: string | null;
  openingAt: string | null;
  updatedAt: string | null;
  detailUrl: string;
  estimatedValue: number | null;
};

export type CivicNewsSource = 'council' | 'city_hall';

export type CivicNews = ScrapedItemBase & {
  kind: 'civic-news';
  source: CivicNewsSource;
  excerpt: string | null;
  thumbnailUrl: string | null;
};

export type CouncilProposition = ScrapedItemBase & {
  kind: 'council-proposition';
  externalId: string;
  propositionType: string | null;
  number: string | null;
  author: string | null;
  situation: string | null;
  presentedAt: string | null;
  downloadUrl: string | null;
};

export type ScrapedItem =
  | DiaryEdition
  | CouncilMeeting
  | PublicTender
  | CivicNews
  | CouncilProposition;

export type City = {
  id: string;
  slug: string;
  name: string;
};

export type AiJob = {
  id: string;
};
