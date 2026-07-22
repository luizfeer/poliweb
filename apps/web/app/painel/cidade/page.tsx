import { Link } from '@/components/navigation/link';
import {
  Blocks,
  Building2,
  ChevronRight,
  ClipboardList,
  Map,
  MapPinned,
  ServerCog,
  ShieldCheck,
  Stethoscope,
  Store,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';
import { getCurrentCity } from '@/lib/cities';
import { requireRole } from '@/lib/auth';

type AdminArea = {
  href: string;
  title: string;
  text: string;
  icon: LucideIcon;
  tone: string;
};

const areas: AdminArea[] = [
  {
    href: '/painel/cidade/equipe',
    title: 'Equipe',
    text: 'Papéis por cidade, administradores e moderadores.',
    icon: UsersRound,
    tone: 'bg-sky-100 text-sky-700',
  },
  {
    href: '/painel/cidade/comercio',
    title: 'Comércio',
    text: 'Fichas, categorias, claims e importações.',
    icon: Store,
    tone: 'bg-cerrado-100 text-cerrado-700',
  },
  {
    href: '/painel/cidade/turismo',
    title: 'Turismo',
    text: 'Atrações, pesca, pacotes e aprovações.',
    icon: Map,
    tone: 'bg-clay-50 text-clay-700',
  },
  {
    href: '/painel/cidade/servicos',
    title: 'Serviços',
    text: 'Coleta, telefones, farmácias, saúde e alertas.',
    icon: Stethoscope,
    tone: 'bg-sun-100 text-ink-900',
  },
  {
    href: '/painel/cidade/modulos',
    title: 'Módulos',
    text: 'Liga e desliga funcionalidades por cidade.',
    icon: Blocks,
    tone: 'bg-clay-50 text-clay-700',
  },
  {
    href: '/painel/cidade/distritos',
    title: 'Distritos',
    text: 'Bairros, zonas e referências da cidade.',
    icon: MapPinned,
    tone: 'bg-cerrado-100 text-cerrado-700',
  },
  {
    href: '/painel/cidade/audit',
    title: 'Audit',
    text: 'Registro de ações sensíveis e rastreabilidade.',
    icon: ClipboardList,
    tone: 'bg-sky-100 text-sky-700',
  },
  {
    href: '/painel/cidade/jobs',
    title: 'Jobs & Crons',
    text: 'Monitor de scraping, IA, embeddings e erros.',
    icon: ServerCog,
    tone: 'bg-muted text-muted-foreground',
  },
  {
    href: '/painel/cidade/imoveis',
    title: 'Imóveis',
    text: 'Preços, aprovações, imobiliárias e destaques.',
    icon: Building2,
    tone: 'bg-clay-50 text-clay-700',
  },
];

export default async function CidadePage() {
  const city = await getCurrentCity();
  if (!city) return null;

  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });

  return (
    <div className="space-y-6">
      <header className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="border-b bg-clay-50 px-5 py-5 sm:px-6">
          <p className="text-sm font-medium text-clay-700">Admin da cidade</p>
          <h1 className="mt-1 text-3xl font-bold text-foreground">{city.name}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Configure os módulos e acompanhe a operação local sem misturar dados de outras cidades.
          </p>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-2 sm:px-6">
          <div className="flex items-start gap-3 rounded-lg bg-background p-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <ShieldCheck className="size-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold">Módulos ativos</p>
              <p className="text-sm text-muted-foreground">
                {city.modules.length ? `${city.modules.length} módulos habilitados` : 'Nenhum módulo habilitado'}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg bg-background p-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <MapPinned className="size-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold">Contexto atual</p>
              <p className="text-sm text-muted-foreground">{city.name}/{city.state}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="grid gap-3 md:grid-cols-2">
        {areas.map((area) => {
          const Icon = area.icon;

          return (
            <Link
              key={area.href}
              href={area.href}
              prefetch={false}
              className="group flex min-h-32 items-start gap-4 rounded-xl border bg-card p-4 text-foreground shadow-sm transition hover:border-clay-300 hover:bg-clay-50 hover:no-underline"
            >
              <span className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${area.tone}`}>
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-semibold">{area.title}</span>
                <span className="mt-1 block text-sm text-muted-foreground">{area.text}</span>
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
