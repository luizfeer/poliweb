import 'server-only';

import { publicCached } from '@/lib/cache/public-query';
import type {
  CivicNews,
  CouncilMeeting,
  CouncilProposition,
  DiaryAct,
  OfficialDiary,
  PublicTender,
  TransparencySnapshot,
} from './types';

type DiaryActRow = {
  id: string;
  title: string | null;
  act_type: string | null;
  summary_ai: string | null;
  raw_text: string | null;
  importance: string | null;
};

type OfficialDiaryRow = {
  id: string;
  date: string;
  number: string | null;
  source_url: string | null;
  pages: number | null;
  diary_acts?: DiaryActRow[] | null;
};

type CouncilMeetingRow = {
  id: string;
  date: string;
  session_type: string | null;
  source_url: string | null;
  summary_ai: string | null;
};

type PublicTenderRow = {
  id: string;
  number: string | null;
  title: string;
  modality: string | null;
  status: string | null;
  deadline: string | null;
  estimated_value: number | null;
  source_url: string | null;
  raw_text: string | null;
  summary_ai: string | null;
};

type CivicNewsRow = {
  id: string;
  source: 'city_hall' | 'council';
  title: string;
  excerpt: string | null;
  summary_ai: string | null;
  raw_text: string | null;
  source_url: string;
  thumbnail_url: string | null;
  published_at: string | null;
};

type CouncilPropositionRow = {
  id: string;
  proposition_type: string | null;
  number: string | null;
  title: string;
  author: string | null;
  situation: string | null;
  presented_at: string | null;
  summary_ai: string | null;
  source_url: string;
  download_url: string | null;
};

export function getLatestCouncilMeeting(cityId: string): Promise<CouncilMeeting | null> {
  return publicCached(
    {
      key: 'transparency:latest-council-meeting',
      tags: ['transparency', `transparency:${cityId}`],
      revalidate: 86400,
      parts: [cityId],
    },
    async (supabase) => {
      const { data, error } = await supabase
        .from('council_meetings')
        .select('id, date, session_type, source_url, summary_ai')
        .eq('city_id', cityId)
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) return null;
      return toCouncilMeeting(data as CouncilMeetingRow);
    },
  );
}

export function getTransparencySnapshot(cityId: string): Promise<TransparencySnapshot> {
  return publicCached(
    {
      key: 'transparency:snapshot',
      tags: ['transparency', `transparency:${cityId}`],
      revalidate: 600,
      parts: [cityId],
    },
    (supabase) => loadTransparencySnapshot(supabase, cityId),
  );
}

async function loadTransparencySnapshot(
  supabase: ReturnType<typeof import('@/lib/supabase/public').createPublicClient>,
  cityId: string,
): Promise<TransparencySnapshot> {
  const [diaries, meetings, tenders, councilNews, cityHallNews, propositions] = await Promise.all([
    supabase
      .from('official_diaries')
      .select('id, date, number, source_url, pages, diary_acts(id, title, act_type, summary_ai, raw_text, importance)')
      .eq('city_id', cityId)
      .order('date', { ascending: false })
      .limit(12),
    supabase
      .from('council_meetings')
      .select('id, date, session_type, source_url, summary_ai')
      .eq('city_id', cityId)
      .order('date', { ascending: false })
      .limit(8),
    supabase
      .from('public_tenders')
      .select('id, number, title, modality, status, deadline, estimated_value, source_url, raw_text, summary_ai')
      .eq('city_id', cityId)
      .order('created_at', { ascending: false })
      .limit(10),
    selectPublicRows<CivicNewsRow>(
      'civic_news',
      `city_id=eq.${cityId}&source=eq.council&select=id,source,title,excerpt,summary_ai,raw_text,source_url,thumbnail_url,published_at&order=published_at.desc.nullslast&limit=12`,
    ),
    selectPublicRows<CivicNewsRow>(
      'civic_news',
      `city_id=eq.${cityId}&source=eq.city_hall&select=id,source,title,excerpt,summary_ai,raw_text,source_url,thumbnail_url,published_at&order=published_at.desc.nullslast&limit=12`,
    ),
    selectPublicRows<CouncilPropositionRow>(
      'council_propositions',
      `city_id=eq.${cityId}&select=id,proposition_type,number,title,author,situation,presented_at,summary_ai,source_url,download_url&order=presented_at.desc.nullslast&limit=10`,
    ),
  ]);

  return {
    diaries: diaries.error ? [] : ((diaries.data ?? []) as unknown as OfficialDiaryRow[]).map(toOfficialDiary),
    meetings: meetings.error ? [] : ((meetings.data ?? []) as CouncilMeetingRow[]).map(toCouncilMeeting),
    tenders: tenders.error ? [] : ((tenders.data ?? []) as PublicTenderRow[]).map(toPublicTender),
    councilNews: councilNews.map(toCivicNews),
    cityHallNews: cityHallNews.map(toCivicNews),
    propositions: propositions.map(toCouncilProposition),
  };
}

async function selectPublicRows<T>(table: string, query: string): Promise<T[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return [];
  }

  const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/${table}?${query}`, {
    headers: {
      apikey: anonKey,
      authorization: `Bearer ${anonKey}`,
    },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    return [];
  }

  return (await response.json()) as T[];
}

function toOfficialDiary(row: OfficialDiaryRow): OfficialDiary {
  return {
    id: row.id,
    date: row.date,
    number: row.number,
    sourceUrl: row.source_url,
    pages: row.pages,
    acts: (row.diary_acts ?? []).map(toDiaryAct),
  };
}

function toDiaryAct(row: DiaryActRow): DiaryAct {
  return {
    id: row.id,
    title: row.title ?? 'Ato oficial',
    actType: row.act_type,
    summaryAi: row.summary_ai,
    rawText: row.raw_text,
    importance: row.importance,
  };
}

function toCouncilMeeting(row: CouncilMeetingRow): CouncilMeeting {
  return {
    id: row.id,
    date: row.date,
    sessionType: row.session_type,
    sourceUrl: row.source_url,
    summaryAi: row.summary_ai,
  };
}

function toPublicTender(row: PublicTenderRow): PublicTender {
  return {
    id: row.id,
    number: row.number,
    title: row.title,
    modality: row.modality,
    status: row.status,
    deadline: row.deadline,
    estimatedValue: row.estimated_value,
    sourceUrl: row.source_url,
    rawText: row.raw_text,
    summaryAi: row.summary_ai,
  };
}

function toCivicNews(row: CivicNewsRow): CivicNews {
  return {
    id: row.id,
    source: row.source,
    title: row.title,
    excerpt: row.excerpt,
    summaryAi: row.summary_ai,
    rawText: row.raw_text,
    sourceUrl: row.source_url,
    thumbnailUrl: row.thumbnail_url,
    publishedAt: row.published_at,
  };
}

function toCouncilProposition(row: CouncilPropositionRow): CouncilProposition {
  return {
    id: row.id,
    propositionType: row.proposition_type,
    number: row.number,
    title: row.title,
    author: row.author,
    situation: row.situation,
    presentedAt: row.presented_at,
    summaryAi: row.summary_ai,
    sourceUrl: row.source_url,
    downloadUrl: row.download_url,
  };
}
