'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireProfile } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { createClient } from '@/lib/supabase/server';
import { anthropic, MODELS } from '@/lib/ai/anthropic';
import { getMonthlyReport, type MonthlyMetricRow, type MonthlyReport } from './report-queries';

// Tabela/RPCs novas ainda não estão no database.types — cast permissivo.
async function db() {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return supabase as unknown as { from: (t: string) => any; rpc: (fn: string, args?: unknown) => any };
}

async function assertManagesBusiness(businessId: string) {
  const supabase = await createClient();
  const { data } = await supabase.rpc('manages_business', { p_business_id: businessId });
  if (!data) throw new Error('Sem permissão para esse negócio.');
}

function firstDayOf(month: string): string {
  return `${month}-01`;
}

function prevMonthFirstDay(month: string): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1, 1));
  d.setUTCMonth(d.getUTCMonth() - 1);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-01`;
}

function isClosedMonth(month: string): boolean {
  const [y, m] = month.split('-').map(Number);
  const now = new Date();
  const currentFirst = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const requested = new Date(Date.UTC(y, m - 1, 1));
  return requested < currentFirst;
}

const MONTH_LABELS = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

function monthLabel(monthFirstDay: string): string {
  const [y, m] = monthFirstDay.split('-').map(Number);
  return `${MONTH_LABELS[m - 1]} de ${y}`;
}

async function fetchMetricRow(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: { rpc: (fn: string, args?: unknown) => any },
  businessId: string,
  monthFirstDay: string,
): Promise<MonthlyMetricRow> {
  const [{ data: sumRows }, { data: favCount }] = await Promise.all([
    supabase.rpc('monthly_business_metrics', { p_business_id: businessId, p_month: monthFirstDay }),
    supabase.rpc('monthly_favorites_count', { p_business_id: businessId, p_month: monthFirstDay }),
  ]);
  const s = (Array.isArray(sumRows) ? sumRows[0] : sumRows) ?? {};
  return {
    views: Number(s.views ?? 0),
    phoneClicks: Number(s.phone_clicks ?? 0),
    whatsappClicks: Number(s.whatsapp_clicks ?? 0),
    mapClicks: Number(s.map_clicks ?? 0),
    websiteClicks: Number(s.website_clicks ?? 0),
    totalEvents: Number(s.total_events ?? 0),
    favorites: Number(favCount ?? 0),
  };
}

async function aiSummary(input: {
  cityId: string;
  businessName: string;
  monthFirstDay: string;
  current: MonthlyMetricRow;
  prev: MonthlyMetricRow | null;
  categorySlug: string | null;
  rank: number | null;
  size: number | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: { from: (t: string) => any };
}): Promise<{ summary: string | null; aiJobId: string | null }> {
  const { cityId, businessName, monthFirstDay, current, prev, categorySlug, rank, size, supabase } = input;

  const rankLine =
    rank && size && categorySlug ? `Ranking: ${rank}º lugar de ${size} em "${categorySlug}".` : 'Sem ranking na categoria.';
  const prevLine = prev
    ? `Mês anterior: ${prev.views} visitas, ${prev.whatsappClicks} no WhatsApp.`
    : 'Sem dados do mês anterior.';
  const prompt = [
    `Escreva um resumo curto e amigável em PT-BR (2 a 3 frases) para o dono do negócio "${businessName}",`,
    `sobre o desempenho da página dele em ${monthLabel(monthFirstDay)}. Tom otimista e direto, sem jargão, sem markdown.`,
    `Dados do mês: ${current.views} visitas, ${current.whatsappClicks} cliques no WhatsApp, ${current.phoneClicks} ligações,`,
    `${current.mapClicks} pedidos de "como chegar", ${current.favorites} novos favoritos. ${rankLine} ${prevLine}`,
    `Não invente números que não foram dados.`,
  ].join(' ');

  // Log do job (running → completed), guardando o id pra FK.
  const { data: job } = await supabase
    .from('ai_jobs')
    .insert({
      city_id: cityId,
      job_type: 'monthly_report',
      status: 'running',
      model: MODELS.haiku,
      input_ref: { business_name: businessName, month: monthFirstDay },
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single();
  const aiJobId = (job?.id as string | undefined) ?? null;

  try {
    const response = await anthropic().messages.create({
      model: MODELS.haiku,
      max_tokens: 250,
      messages: [{ role: 'user', content: prompt }],
    });
    const summary = response.content
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('\n')
      .trim();

    if (aiJobId) {
      await supabase
        .from('ai_jobs')
        .update({
          status: 'completed',
          output_ref: { summary },
          tokens_input: response.usage.input_tokens,
          tokens_output: response.usage.output_tokens,
          finished_at: new Date().toISOString(),
        })
        .eq('id', aiJobId);
    }
    return { summary, aiJobId };
  } catch (e) {
    if (aiJobId) {
      await supabase
        .from('ai_jobs')
        .update({ status: 'failed', error: e instanceof Error ? e.message : 'erro', finished_at: new Date().toISOString() })
        .eq('id', aiJobId);
    }
    return { summary: null, aiJobId };
  }
}

const readSchema = z.object({
  businessId: z.string().uuid(),
  month: z.string().regex(/^\d{4}-\d{2}$/),
});

/** Leitura do boletim de um mês (sem gerar). Usado pelo seletor de mês no painel. */
export async function getMonthlyReportAction(
  input: z.input<typeof readSchema>,
): Promise<{ ok: boolean; report?: MonthlyReport | null; error?: string }> {
  const city = await getCurrentCity();
  if (!city) return { ok: false, error: 'Cidade não encontrada.' };
  await requireProfile();
  const parsed = readSchema.parse(input);
  await assertManagesBusiness(parsed.businessId);
  const report = await getMonthlyReport(parsed.businessId, firstDayOf(parsed.month));
  return { ok: true, report };
}

const generateSchema = z.object({
  businessId: z.string().uuid(),
  month: z.string().regex(/^\d{4}-\d{2}$/), // 'YYYY-MM'
  force: z.boolean().optional(),
});

export async function generateMonthlyReportAction(
  input: z.input<typeof generateSchema>,
): Promise<{ ok: boolean; report?: MonthlyReport; error?: string }> {
  const city = await getCurrentCity();
  if (!city) return { ok: false, error: 'Cidade não encontrada.' };
  await requireProfile();
  const parsed = generateSchema.parse(input);
  await assertManagesBusiness(parsed.businessId);

  if (!isClosedMonth(parsed.month)) {
    return { ok: false, error: 'O boletim só fica disponível quando o mês termina.' };
  }

  const monthFirstDay = firstDayOf(parsed.month);

  if (!parsed.force) {
    const cached = await getMonthlyReport(parsed.businessId, monthFirstDay);
    if (cached) return { ok: true, report: cached };
  }

  const supabase = await db();

  const { data: biz } = await supabase
    .from('businesses')
    .select('name')
    .eq('id', parsed.businessId)
    .eq('city_id', city.id)
    .maybeSingle();
  const businessName = (biz?.name as string | undefined) ?? 'seu negócio';

  const [current, prev, { data: rankRows }] = await Promise.all([
    fetchMetricRow(supabase, parsed.businessId, monthFirstDay),
    fetchMetricRow(supabase, parsed.businessId, prevMonthFirstDay(parsed.month)),
    supabase.rpc('monthly_category_rank', { p_business_id: parsed.businessId, p_month: monthFirstDay }),
  ]);

  const rankRow = (Array.isArray(rankRows) ? rankRows[0] : rankRows) ?? null;
  const categorySlug = (rankRow?.category_slug as string | undefined) ?? null;
  const categoryRank = rankRow?.rank != null ? Number(rankRow.rank) : null;
  const categorySize = rankRow?.category_size != null ? Number(rankRow.category_size) : null;

  const { summary, aiJobId } = await aiSummary({
    cityId: city.id,
    businessName,
    monthFirstDay,
    current,
    prev,
    categorySlug,
    rank: categoryRank,
    size: categorySize,
    supabase,
  });

  const metrics = { ...current, prev };

  const { data: saved, error } = await supabase
    .from('business_monthly_reports')
    .upsert(
      {
        city_id: city.id,
        business_id: parsed.businessId,
        month: monthFirstDay,
        metrics,
        category_slug: categorySlug,
        category_rank: categoryRank,
        category_size: categorySize,
        ai_summary: summary,
        ai_job_id: aiJobId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'business_id,month' },
    )
    .select('*')
    .single();

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/painel/comercio/${parsed.businessId}/boletim`);

  return {
    ok: true,
    report: {
      id: saved.id,
      businessId: saved.business_id,
      month: saved.month,
      metrics: saved.metrics,
      categorySlug: saved.category_slug,
      categoryRank: saved.category_rank,
      categorySize: saved.category_size,
      aiSummary: saved.ai_summary,
      createdAt: saved.created_at,
    },
  };
}
