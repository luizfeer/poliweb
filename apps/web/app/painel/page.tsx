import { Link } from '@/components/navigation/link';
import { Building2, ChevronRight, Landmark, ShieldCheck, Store, UserRound, type LucideIcon } from 'lucide-react';
import { getCurrentCity } from '@/lib/cities';
import { getHighestRole, requireProfile } from '@/lib/auth';
import { NotificationsWidget } from '@/components/painel/notifications-widget';

type DashboardCard = {
  href: string;
  title: string;
  text: string;
  icon: LucideIcon;
  tone: string;
};

export default async function PainelPage() {
  const [auth, city] = await Promise.all([requireProfile(), getCurrentCity()]);
  const highestRole = city ? getHighestRole(auth.roles, city.id) : null;
  const cards: DashboardCard[] = [
    {
      href: '/painel/perfil',
      title: 'Perfil',
      text: 'Atualize nome, telefone, privacidade e preferências da conta.',
      icon: UserRound,
      tone: 'bg-clay-50 text-clay-700',
    },
    {
      href: '/painel/cidade',
      title: 'Admin da cidade',
      text: 'Módulos, distritos, equipe, auditoria e operação local.',
      icon: Landmark,
      tone: 'bg-sky-100 text-sky-700',
    },
    {
      href: '/painel/comercio',
      title: 'Comércio',
      text: 'Gerencie páginas comerciais, promoções, avaliações e cardápios.',
      icon: Store,
      tone: 'bg-cerrado-100 text-cerrado-700',
    },
  ];

  return (
    <div className="space-y-6">
      <header className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="border-b bg-clay-50 px-5 py-5 sm:px-6">
          <p className="text-sm font-medium text-clay-700">Painel</p>
          <h1 className="mt-1 text-3xl font-bold text-foreground">Olá, {auth.profile.full_name ?? 'usuário'}.</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Acompanhe sua conta e as áreas disponíveis para {city?.name ?? 'cidade atual'}.
          </p>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-2 sm:px-6">
          <div className="flex items-start gap-3 rounded-lg bg-background p-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <ShieldCheck className="size-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold">Papel atual</p>
              <p className="text-sm text-muted-foreground">
                {highestRole ?? 'sem papel'} em {city?.name ?? 'cidade atual'}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg bg-background p-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Building2 className="size-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold">Cidade ativa</p>
              <p className="text-sm text-muted-foreground">
                {city ? `${city.name}/${city.state}` : 'Nenhuma cidade selecionada'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <NotificationsWidget profileId={auth.profile.id} />

      <div className="grid gap-3 md:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <Link
              key={card.href}
              className="group flex min-h-36 items-start gap-4 rounded-xl border bg-card p-4 text-foreground shadow-sm transition hover:border-clay-300 hover:bg-clay-50 hover:no-underline"
              href={card.href}
              prefetch={false}
            >
              <span className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${card.tone}`}>
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-semibold">{card.title}</span>
                <span className="mt-1 block text-sm text-muted-foreground">{card.text}</span>
              </span>
              <ChevronRight
                className="mt-1 size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-clay-700"
                aria-hidden="true"
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
