import 'server-only';

import { createClient } from '@/lib/supabase/server';

export type MonthlyMetricRow = {
  views: number;
  phoneClicks: number;
  whatsappClicks: number;
  mapClicks: number;
  websiteClicks: number;
  totalEvents: number;
  favorites: number;
};

export type MonthlyMetrics = MonthlyMetricRow & {
  prev: MonthlyMetricRow | null;
};

export type MonthlyReport = {
  id: string;
  businessId: string;
  month: string; // 'YYYY-MM-01'
  metrics: MonthlyMetrics;
  categorySlug: string | null;
  categoryRank: number | null;
  categorySize: number | null;
  aiSummary: string | null;
  createdAt: string;
};

// Tabela nova ainda não está no database.types gerado — cast permissivo.
async function db() {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return supabase as unknown as { from: (t: string) => any };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapReport(r: any): MonthlyReport {
  return {
    id: r.id,
    businessId: r.business_id,
    month: r.month,
    metrics: (r.metrics ?? {}) as MonthlyMetrics,
    categorySlug: r.category_slug ?? null,
    categoryRank: r.category_rank ?? null,
    categorySize: r.category_size ?? null,
    aiSummary: r.ai_summary ?? null,
    createdAt: r.created_at,
  };
}

/** Relatório de um mês específico (month = 'YYYY-MM-01'), ou null se ainda não gerado. */
export async function getMonthlyReport(businessId: string, month: string): Promise<MonthlyReport | null> {
  const supabase = await db();
  const { data } = await supabase
    .from('business_monthly_reports')
    .select('*')
    .eq('business_id', businessId)
    .eq('month', month)
    .maybeSingle();
  return data ? mapReport(data) : null;
}

/** Meses já gerados (mais recente primeiro) — pra montar o seletor. */
export async function listReportMonths(businessId: string): Promise<string[]> {
  const supabase = await db();
  const { data } = await supabase
    .from('business_monthly_reports')
    .select('month')
    .eq('business_id', businessId)
    .order('month', { ascending: false });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as any[]).map((r) => r.month as string);
}
