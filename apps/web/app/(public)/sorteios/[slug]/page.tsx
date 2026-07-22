import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { RaffleEntryForm } from '@/components/raffles/raffle-entry-form';
import { getProfile } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { getMyBalance } from '@/lib/points';
import {
  getMyEntriesCount,
  getRaffleBySlug,
  getRaffleStats,
} from '@/lib/raffles';
import { buildMetadata } from '@/lib/seo/metadata';

type Props = {
  params: Promise<{ slug: string }>;
};

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const city = await getCurrentCity();
  if (!city) return { title: 'Sorteio' };
  const { slug } = await params;
  const raffle = await getRaffleBySlug(city.id, slug);
  if (!raffle) return { title: 'Sorteio não encontrado' };
  return buildMetadata({
    title: `${raffle.title} — Sorteio do Portal Carmelitano`,
    description:
      raffle.description ??
      `Participe do sorteio "${raffle.title}" no Portal Carmelitano. Acumule pontos e concorra a prêmios em Carmo do Rio Claro/MG.`,
    path: `/sorteios/${slug}`,
    image: raffle.coverUrl ?? undefined,
  });
}

export default async function RafflePage({ params }: Props) {
  const { slug } = await params;
  const city = await getCurrentCity();
  if (!city) notFound();

  const raffle = await getRaffleBySlug(city.id, slug);
  if (!raffle) notFound();

  const auth = await getProfile();
  const stats = await getRaffleStats(raffle.id);

  const myEntries = auth ? await getMyEntriesCount(raffle.id, auth.profile.id) : 0;
  const balance = auth ? await getMyBalance(city.id) : null;
  const remaining = raffle.maxEntriesPerProfile - myEntries;

  // eslint-disable-next-line react-hooks/purity -- Date.now is acceptable in async server component
  const isActive = raffle.status === 'active' && new Date(raffle.drawAt).getTime() > Date.now();
  const isEnded = raffle.status === 'drawn';

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-4 py-12">
      <nav className="text-sm">
        <Link href="/sorteios" className="text-muted-foreground hover:text-foreground">
          ← Todos os sorteios
        </Link>
      </nav>

      {raffle.coverUrl && (
        <div className="relative aspect-[21/9] w-full overflow-hidden rounded-2xl bg-muted">
          <Image
            src={raffle.coverUrl}
            alt={raffle.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 800px"
            priority
          />
        </div>
      )}

      <header className="space-y-3">
        <div className="flex items-start gap-3">
          <h1 className="flex-1 text-4xl font-bold">{raffle.title}</h1>
          {isEnded && (
            <span className="rounded-full bg-muted px-3 py-1 text-sm">Sorteio realizado</span>
          )}
        </div>
        <p className="text-lg text-muted-foreground">🎁 {raffle.prizeDescription}</p>
        {raffle.prizeValueCents !== null && (
          <p className="text-sm text-muted-foreground">
            Valor estimado: {(raffle.prizeValueCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        )}
      </header>

      {raffle.description && (
        <section className="prose prose-sm max-w-none text-foreground">
          <p className="whitespace-pre-line text-base leading-relaxed">{raffle.description}</p>
        </section>
      )}

      <section className="grid gap-3 rounded-2xl border bg-card p-6 sm:grid-cols-3">
        <div>
          <p className="text-xs uppercase text-muted-foreground">Sorteio</p>
          <p className="font-medium">
            {new Date(raffle.drawAt).toLocaleString('pt-BR', { timeZone: city.timezone, dateStyle: 'short', timeStyle: 'short' })}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase text-muted-foreground">Entradas até agora</p>
          <p className="font-medium">{stats.totalEntries} de {stats.uniqueProfiles} {stats.uniqueProfiles === 1 ? 'pessoa' : 'pessoas'}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-muted-foreground">Custo por entrada</p>
          <p className="font-medium">{raffle.entryCostPoints} pts</p>
        </div>
      </section>

      {isActive && (
        <section className="rounded-2xl border bg-gradient-to-br from-amber-50 to-orange-50 p-6 dark:from-amber-950/30 dark:to-orange-950/30">
          {!auth ? (
            <div className="space-y-3 text-center">
              <p className="text-sm">Entre na sua conta para participar.</p>
              <Link
                href="/entrar"
                className="inline-block rounded-xl bg-amber-600 px-6 py-3 font-medium text-white hover:bg-amber-700"
              >
                Entrar ou cadastrar
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span>
                  Suas entradas: <strong>{myEntries}</strong> / {raffle.maxEntriesPerProfile}
                </span>
                <span>
                  Seu saldo: <strong>{balance?.balance ?? 0} pts</strong>
                </span>
              </div>
              <RaffleEntryForm
                raffleId={raffle.id}
                entryCostPoints={raffle.entryCostPoints}
                maxEntries={raffle.maxEntriesPerProfile}
                remainingEntries={remaining}
                userBalance={balance?.balance ?? 0}
              />
            </div>
          )}
        </section>
      )}

      {isEnded && raffle.winnerProfileId && (
        <section className="rounded-2xl border bg-emerald-50 p-6 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
          <p className="text-sm uppercase tracking-wide">Resultado</p>
          <p className="mt-1 font-medium">
            Sorteio realizado em {raffle.drawnAt ? new Date(raffle.drawnAt).toLocaleString('pt-BR', { timeZone: city.timezone }) : ''}
          </p>
          <p className="mt-2 text-sm">O ganhador foi notificado por email.</p>
        </section>
      )}
    </main>
  );
}
