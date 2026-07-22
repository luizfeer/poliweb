import Image from 'next/image';
import Link from 'next/link';
import type { RaffleSummary } from '@/lib/raffles';

type Props = {
  raffle: RaffleSummary;
  timezone: string;
};

function daysUntil(iso: string): number {
  const diffMs = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
}

export function RaffleCard({ raffle, timezone }: Props) {
  const isEnded = raffle.status === 'drawn';
  const days = daysUntil(raffle.drawAt);

  return (
    <Link
      href={`/sorteios/${raffle.slug}`}
      className="group block overflow-hidden rounded-2xl border bg-card transition hover:shadow-lg"
    >
      {raffle.coverUrl ? (
        <div className="relative aspect-[16/9] w-full bg-muted">
          <Image
            src={raffle.coverUrl}
            alt={raffle.title}
            fill
            className="object-cover transition group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </div>
      ) : (
        <div className="aspect-[16/9] bg-gradient-to-br from-amber-200 via-orange-300 to-rose-300" />
      )}

      <div className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-bold leading-tight">{raffle.title}</h3>
          {isEnded ? (
            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs">Encerrado</span>
          ) : days === 0 ? (
            <span className="shrink-0 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
              Sorteio hoje
            </span>
          ) : (
            <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
              {days} {days === 1 ? 'dia' : 'dias'}
            </span>
          )}
        </div>

        <p className="line-clamp-2 text-sm text-muted-foreground">
          🎁 {raffle.prizeDescription}
        </p>

        <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
          <span>
            {isEnded
              ? `Sorteado ${raffle.drawnAt ? new Date(raffle.drawnAt).toLocaleDateString('pt-BR', { timeZone: timezone }) : ''}`
              : `Sorteio: ${new Date(raffle.drawAt).toLocaleDateString('pt-BR', { timeZone: timezone })}`}
          </span>
          {!isEnded && (
            <span className="font-medium text-foreground">{raffle.entryCostPoints} pts</span>
          )}
        </div>
      </div>
    </Link>
  );
}
