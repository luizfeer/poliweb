import 'server-only';

import { publicCached } from '@/lib/cache/public-query';

export type LiveFeedTone = 'clay' | 'cerrado' | 'sun' | 'sky' | 'ink' | 'green' | 'red';

export type LiveFeedItem = {
  id: string;
  label: string;
  title: string;
  suffix: string | null;
  href: string | null;
  tone: LiveFeedTone;
  sourceKind: string;
  payload: Record<string, unknown>;
};

type LiveFeedRow = {
  id: string;
  source_kind: string;
  label: string;
  title: string;
  suffix: string | null;
  href: string | null;
  tone: string | null;
  payload: unknown;
};

const LIVE_FEED_TONES = new Set<LiveFeedTone>(['clay', 'cerrado', 'sun', 'sky', 'ink', 'green', 'red']);

function normalizeTone(tone: string | null): LiveFeedTone {
  return tone && LIVE_FEED_TONES.has(tone as LiveFeedTone) ? (tone as LiveFeedTone) : 'ink';
}

export function listLiveFeedItems(cityId: string, limit = 4): Promise<LiveFeedItem[]> {
  return publicCached(
    {
      key: 'live-feed-items',
      tags: ['live-feed', `live-feed:${cityId}`],
      revalidate: 60,
      parts: [cityId, limit],
    },
    async (supabase) => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('live_feed_items')
        .select('id, source_kind, label, title, suffix, href, tone, payload')
        .eq('city_id', cityId)
        .eq('status', 'published')
        .lte('starts_at', now)
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .order('priority', { ascending: false })
        .order('published_at', { ascending: false })
        .limit(limit);

      if (error || !data) return [];

      return (data as LiveFeedRow[]).map((row) => ({
        id: row.id,
        label: row.label,
        title: row.title,
        suffix: row.source_kind === 'traffic' ? null : row.suffix,
        href: row.href,
        tone: normalizeTone(row.tone),
        sourceKind: row.source_kind,
        payload: isRecord(row.payload) ? row.payload : {},
      }));
    },
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
