import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { notifyRaffleWinner } from '@/lib/raffles/notifications';
import type { RaffleSummary } from '@/lib/raffles';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Cron diário: sorteia automaticamente todos os sorteios ativos com draw_at
 * no passado. Notifica o vencedor por email.
 *
 * Chamado por Vercel Cron, cron-job.org ou Supabase pg_cron.
 * Auth: header Authorization: Bearer ${CRON_SECRET}
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ ok: false, error: 'CRON_SECRET is required' }, { status: 500 });
  }
  if (secret) {
    const authorization = request.headers.get('authorization');
    if (authorization !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
    }
  }

  const supabase = createServiceRoleClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://carmolocal.com.br';
  const nowIso = new Date().toISOString();

  // Lista sorteios ativos vencidos
  const { data: pending } = await supabase
    .from('raffles')
    .select('*')
    .eq('status', 'active')
    .lte('draw_at', nowIso);

  const results: Array<{ raffleId: string; status: 'drawn' | 'no_entries' | 'error'; winner?: string; error?: string }> = [];

  for (const raffle of pending ?? []) {
    try {
      // Sorteia
      const { data: winnerId, error: drawErr } = await supabase.rpc('draw_raffle_winner', {
        p_raffle_id: raffle.id,
      });

      if (drawErr || !winnerId) {
        results.push({ raffleId: raffle.id, status: 'no_entries', error: drawErr?.message });
        // Marca como cancelled se ninguém entrou
        await supabase.from('raffles').update({ status: 'cancelled' }).eq('id', raffle.id);
        continue;
      }

      // Carrega cidade pra notificação
      const { data: cityRow } = await supabase
        .from('cities')
        .select('name')
        .eq('id', raffle.city_id)
        .maybeSingle();

      // Carrega email do vencedor (auth.users)
      const { data: userData } = await supabase.auth.admin.getUserById(winnerId as string);
      const email = userData?.user?.email;
      const fullName = (userData?.user?.user_metadata?.full_name as string | undefined) ?? 'Cidadão';

      if (email && cityRow) {
        const summary: RaffleSummary = {
          id: raffle.id,
          slug: raffle.slug,
          title: raffle.title,
          description: raffle.description,
          prizeDescription: raffle.prize_description,
          prizeValueCents: raffle.prize_value_cents,
          coverUrl: raffle.cover_url,
          entryCostPoints: raffle.entry_cost_points,
          maxEntriesPerProfile: raffle.max_entries_per_profile,
          drawAt: raffle.draw_at,
          drawnAt: new Date().toISOString(),
          winnerProfileId: winnerId as string,
          status: 'drawn',
          sponsorBusinessId: raffle.sponsor_business_id,
        };

        try {
          await notifyRaffleWinner({
            to: email,
            winnerName: fullName,
            raffle: summary,
            cityName: (cityRow as { name: string }).name,
            appUrl,
          });
        } catch {
          // email é best-effort
        }
      }

      results.push({ raffleId: raffle.id, status: 'drawn', winner: winnerId as string });
    } catch (err) {
      results.push({
        raffleId: raffle.id,
        status: 'error',
        error: err instanceof Error ? err.message : 'unknown',
      });
    }
  }

  return NextResponse.json({
    ok: true,
    checked: pending?.length ?? 0,
    results,
  });
}
