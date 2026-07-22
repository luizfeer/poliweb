import { RaffleCard } from '@/components/raffles/raffle-card';
import { getCurrentCity } from '@/lib/cities';
import { listActiveRaffles, listEndedRaffles } from '@/lib/raffles';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Sorteios — Portal Carmelitano',
  description: 'Participe de sorteios mensais com prêmios da cidade trocando seus pontos.',
};

export default async function SorteiosPage() {
  const city = await getCurrentCity();
  if (!city) return null;

  const [active, ended] = await Promise.all([
    listActiveRaffles(city.id),
    listEndedRaffles(city.id, 6),
  ]);

  return (
    <main className="mx-auto max-w-6xl space-y-12 px-4 py-12">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold">Sorteios</h1>
        <p className="text-muted-foreground">
          Troque seus pontos por entradas. Quanto mais entradas, maior sua chance.
        </p>
      </header>

      <section>
        <h2 className="mb-4 text-2xl font-semibold">Abertos</h2>
        {active.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-muted/30 p-12 text-center text-sm text-muted-foreground">
            Nenhum sorteio aberto no momento. Volte em breve!
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {active.map((raffle) => (
              <RaffleCard key={raffle.id} raffle={raffle} timezone={city.timezone} />
            ))}
          </div>
        )}
      </section>

      {ended.length > 0 && (
        <section>
          <h2 className="mb-4 text-2xl font-semibold">Sorteios anteriores</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {ended.map((raffle) => (
              <RaffleCard key={raffle.id} raffle={raffle} timezone={city.timezone} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
