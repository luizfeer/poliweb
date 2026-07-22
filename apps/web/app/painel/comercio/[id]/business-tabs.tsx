import { Link } from '@/components/navigation/link';
import {
  BarChart3,
  Building2,
  ClipboardList,
  LineChart,
  Sparkles,
  Star,
  Tag,
  Tags,
  Truck,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';

type TabKey =
  | 'dados'
  | 'studio'
  | 'cardapio'
  | 'delivery'
  | 'fila'
  | 'relatorios'
  | 'pedidos'
  | 'categorias'
  | 'promocoes'
  | 'reviews'
  | 'analytics'
  | 'boletim';

const TABS: Array<{ key: TabKey; label: string; icon: LucideIcon; segment: string }> = [
  { key: 'dados', label: 'Dados', icon: Building2, segment: '' },
  { key: 'studio', label: 'Artes', icon: Sparkles, segment: '/studio' },
  { key: 'cardapio', label: 'Cardápio', icon: UtensilsCrossed, segment: '/cardapio' },
  { key: 'delivery', label: 'Delivery', icon: Truck, segment: '/delivery' },
  { key: 'fila', label: 'Fila', icon: ClipboardList, segment: '/fila' },
  { key: 'relatorios', label: 'Relatórios', icon: LineChart, segment: '/relatorios' },
  { key: 'pedidos', label: 'Pedidos', icon: Truck, segment: '/pedidos' },
  { key: 'categorias', label: 'Categorias', icon: Tags, segment: '/categorias' },
  { key: 'promocoes', label: 'Promoções', icon: Tag, segment: '/promocoes' },
  { key: 'reviews', label: 'Avaliações', icon: Star, segment: '/reviews' },
  { key: 'analytics', label: 'Analytics', icon: BarChart3, segment: '/analytics' },
  { key: 'boletim', label: 'Boletim', icon: LineChart, segment: '/boletim' },
];

export function BusinessTabs({ businessId, active }: { businessId: string; active: TabKey }) {
  return (
    <nav className="flex gap-2 overflow-x-auto rounded-xl border border-ink-100 bg-white p-1 shadow-card">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.key === active;
        return (
          <Link
            key={tab.key}
            href={`/painel/comercio/${businessId}${tab.segment}`}
            className={
              isActive
                ? 'inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-clay-50 px-3 py-2 text-sm font-semibold text-clay-700 hover:no-underline'
                : 'inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-ink-700 hover:bg-clay-50 hover:no-underline'
            }
          >
            <Icon className="size-4" aria-hidden="true" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
