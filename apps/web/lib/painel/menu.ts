import type { AuthContext } from '@/lib/auth/types';
import { canManageCity, hasRole } from '@/lib/auth/roles';
import type { CurrentCity } from '@/lib/cities';

export type PainelMenuIcon =
  | 'dashboard'
  | 'bell'
  | 'heart'
  | 'user'
  | 'users'
  | 'handshake'
  | 'coins'
  | 'credit-card'
  | 'ticket'
  | 'store'
  | 'landmark'
  | 'shield-check'
  | 'shield-alert'
  | 'building'
  | 'clipboard'
  | 'map'
  | 'gift'
  | 'chart'
  | 'blocks'
  | 'network'
  | 'flag'
  | 'logout';

export type PainelMenuItem = {
  href: string;
  label: string;
  eyebrow: string;
  icon: PainelMenuIcon;
  badge?: number;
};

export type PainelMenuGroup = {
  title: string;
  items: PainelMenuItem[];
};

type Args = {
  auth: AuthContext;
  city: CurrentCity;
  unreadNotifications: number;
};

export function buildPainelMenu({ auth, city, unreadNotifications }: Args): PainelMenuGroup[] {
  const isCityManager = canManageCity(auth.roles, city.id);
  const isSuperAdmin = hasRole(auth.roles, ['super_admin'], city.id);
  const isMerchant = hasRole(auth.roles, ['merchant'], city.id);

  type Buildable = { title: string; items: (PainelMenuItem & { show: boolean })[] };
  const groups: Buildable[] = [
    {
      title: 'Sua conta',
      items: [
        { href: '/painel', label: 'Resumo', eyebrow: 'Visão geral', icon: 'dashboard', show: true },
        {
          href: '/painel/notificacoes',
          label: 'Notificações',
          eyebrow: 'Alertas e aprovações',
          icon: 'bell',
          show: true,
          ...(unreadNotifications > 0 ? { badge: unreadNotifications } : {}),
        },
        { href: '/painel/favoritos', label: 'Favoritos', eyebrow: 'Salvos para depois', icon: 'heart', show: true },
        { href: '/painel/perfil', label: 'Perfil e privacidade', eyebrow: 'Dados da conta', icon: 'user', show: true },
        { href: '/painel/perfil/pagamentos', label: 'Pagamentos', eyebrow: 'Cobranças e histórico', icon: 'credit-card', show: true },
      ],
    },
    {
      title: 'Sua participação',
      items: [
        { href: '/painel/comunidade', label: 'Minha comunidade', eyebrow: 'Posts e avisos', icon: 'users', show: true },
        { href: '/painel/cidadao/indicar', label: 'Indicar amigos', eyebrow: 'Convites', icon: 'handshake', show: true },
        { href: '/painel/cidadao/pontos', label: 'Meus pontos', eyebrow: 'Fidelidade', icon: 'coins', show: true },
        { href: '/painel/cidadao/sorteios', label: 'Meus sorteios', eyebrow: 'Prêmios', icon: 'ticket', show: true },
      ],
    },
    {
      title: 'Minhas páginas',
      items: [
        { href: '/painel/comercio', label: 'Página do comércio', eyebrow: 'Ficha, pedidos e reviews', icon: 'store', show: isMerchant },
      ],
    },
    {
      title: 'Administração da cidade',
      items: [
        { href: '/painel/cidade', label: 'Resumo da cidade', eyebrow: 'Admin', icon: 'landmark', show: isCityManager },
        { href: '/painel/cidade/notificacoes', label: 'Central admin', eyebrow: 'Inbox operacional', icon: 'bell', show: isCityManager },
        { href: '/painel/cidade/comunidade', label: 'Comunidade', eyebrow: 'Moderação', icon: 'shield-check', show: isCityManager },
        { href: '/painel/cidade/comercio', label: 'Comércio', eyebrow: 'Negócios', icon: 'building', show: isCityManager },
        { href: '/painel/cidade/comercio/leads', label: 'Leads de comércio', eyebrow: 'Solicitações pendentes', icon: 'clipboard', show: isCityManager },
        { href: '/painel/cidade/turismo', label: 'Turismo', eyebrow: 'Guias e aprovações', icon: 'map', show: isCityManager },
        { href: '/painel/cidade/servicos', label: 'Serviços públicos', eyebrow: 'Utilidade', icon: 'handshake', show: isCityManager },
        { href: '/painel/cidade/sorteios', label: 'Sorteios', eyebrow: 'Campanhas', icon: 'gift', show: isCityManager },
        { href: '/painel/cidade/pontos', label: 'Pontos da cidade', eyebrow: 'Engajamento', icon: 'chart', show: isCityManager },
      ],
    },
    {
      title: 'Configuração',
      items: [
        { href: '/painel/cidade/equipe', label: 'Equipe e acessos', eyebrow: 'Permissões', icon: 'users', show: isCityManager },
        { href: '/painel/cidade/modulos', label: 'Módulos', eyebrow: 'Liga/desliga', icon: 'blocks', show: isCityManager },
        { href: '/painel/cidade/home', label: 'Home da cidade', eyebrow: 'Blocos e banners', icon: 'dashboard', show: isCityManager },
        { href: '/painel/cidade/distritos', label: 'Distritos', eyebrow: 'Bairros e regiões', icon: 'network', show: isCityManager },
        { href: '/painel/cidade/audit', label: 'Auditoria', eyebrow: 'Segurança', icon: 'clipboard', show: isCityManager },
        { href: '/painel/super/workers', label: 'Super: workers', eyebrow: 'Jobs e logs', icon: 'clipboard', show: isSuperAdmin },
        { href: '/painel/super/pagamentos', label: 'Super: pagamentos', eyebrow: 'Financeiro', icon: 'credit-card', show: isSuperAdmin },
        { href: '/painel/super/cidades', label: 'Super: cidades', eyebrow: 'Global', icon: 'flag', show: isSuperAdmin },
        { href: '/painel/super/exclusoes', label: 'Super: exclusões', eyebrow: 'LGPD', icon: 'shield-alert', show: isSuperAdmin },
      ],
    },
  ];

  return groups
    .map((group) => ({
      title: group.title,
      items: group.items
        .filter((item) => item.show)
        .map(({ show: _show, ...rest }) => rest),
    }))
    .filter((group) => group.items.length > 0);
}
