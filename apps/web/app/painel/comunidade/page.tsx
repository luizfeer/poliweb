import { Clock3, HeartHandshake, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { CommunityActionCards } from '@/components/painel/community-action-cards';
import { requireProfile } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { listEventCategories } from '@/lib/community/queries';

export const metadata = { title: 'Minha comunidade - Portal Carmelitano' };

export default async function MyCommunityPage() {
  await requireProfile();
  const city = await getCurrentCity();
  const eventCategories = city?.modules.includes('events') ? await listEventCategories(city.id) : [];

  return (
    <main className="space-y-6">
      <header className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="border-b bg-clay-50 px-5 py-4 sm:px-6">
          <p className="text-sm font-medium text-clay-700">{city?.name ?? 'Cidade'}</p>
          <h1 className="mt-1 text-3xl font-bold text-foreground">Minha comunidade</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Envie avisos úteis para a cidade e acompanhe o que precisa passar pela moderação.
          </p>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-2 sm:px-6">
          <div className="flex items-start gap-3 rounded-lg bg-background p-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Clock3 className="size-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold">Envios em análise</p>
              <p className="text-sm text-muted-foreground">Conteúdos novos ficam pendentes até a moderação.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg bg-background p-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <ShieldCheck className="size-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold">Publicação segura</p>
              <p className="text-sm text-muted-foreground">Evite dados sensíveis e endereço residencial completo.</p>
            </div>
          </div>
        </div>
      </header>

      {city && <CommunityActionCards cityId={city.id} eventCategories={eventCategories} />}

      <section className="flex flex-wrap gap-3">
        <Link href="/painel/comunidade/grupos" className="rounded-md border px-4 py-2 text-sm">
          Gerenciar grupos e coletivos
        </Link>
        <Link href="/comunidade/grupos" className="rounded-md border px-4 py-2 text-sm">
          Ver diretorio publico
        </Link>
      </section>

      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-cerrado-100 text-cerrado-700">
            <HeartHandshake className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-lg font-semibold">Ajude a manter a cidade atualizada</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Quanto mais completos forem os detalhes, mais rápido a moderação consegue conferir e publicar.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
