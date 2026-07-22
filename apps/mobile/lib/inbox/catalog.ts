import type { InboxFeature, InboxFeatureId } from '@/lib/inbox/types';
import { palette } from '@/lib/theme/tokens';

export const INBOX_FEATURES: InboxFeature[] = [
  {
    id: 'assistant',
    kind: 'ai',
    title: 'TormentaIA',
    storyLabel: 'IA',
    subtitle: 'Assistente da cidade',
    description: 'Tire dúvidas sobre serviços, eventos, turismo e lugares de Carmo do Rio Claro.',
    icon: 'sparkles',
    accent: palette.cerrado700,
    background: palette.cerrado100,
    route: '/assistente',
    status: 'live',
    bullets: ['Perguntas sobre a cidade', 'Roteiros e indicações', 'Histórico das conversas'],
  },
  {
    id: 'merchant',
    kind: 'merchant',
    title: 'Comércios',
    storyLabel: 'Lojas',
    subtitle: 'Mensagens de negócios locais',
    description: 'Um canal para conversar com lojas, prestadores e páginas oficiais dos comércios.',
    icon: 'storefront',
    accent: palette.clay600,
    background: '#F4E7DE',
    route: '/inbox/merchant',
    status: 'soon',
    bullets: ['Atendimento direto', 'Status de orçamentos', 'Novidades de lojas seguidas'],
  },
  {
    id: 'order',
    kind: 'order',
    title: 'Pedidos delivery',
    storyLabel: 'Pedidos',
    subtitle: 'Acompanhe compras e entregas',
    description: 'Aqui vão aparecer conversas sobre preparo, retirada, entrega e suporte do pedido.',
    icon: 'restaurant',
    accent: palette.clay600,
    background: palette.clay50,
    route: '/inbox/order',
    status: 'soon',
    bullets: ['Preparo em tempo real', 'Contato com entrega', 'Recibos e comprovantes'],
  },
  {
    id: 'notifications',
    kind: 'system',
    title: 'Notificações',
    storyLabel: 'Avisos',
    subtitle: 'Alertas importantes da cidade',
    description: 'Comunicados, avisos de serviços públicos, lembretes e respostas do painel.',
    icon: 'notifications',
    accent: palette.sky700,
    background: palette.sky100,
    route: '/inbox/notifications',
    status: 'live',
    bullets: ['Alertas da prefeitura', 'Eventos e lembretes', 'Respostas administrativas'],
  },
  {
    id: 'promotions',
    kind: 'promotion',
    title: 'Descontos e promoções',
    storyLabel: 'Ofertas',
    subtitle: 'Cupons e vantagens locais',
    description: 'Um chat para receber cupons, campanhas relâmpago e benefícios dos comércios parceiros.',
    icon: 'pricetag',
    accent: palette.discount,
    background: '#FFE7EF',
    route: '/inbox/promotions',
    status: 'soon',
    bullets: ['Cupons salvos', 'Ofertas por bairro', 'Promoções de lojas favoritas'],
  },
];

const DEFAULT_INBOX_FEATURE = INBOX_FEATURES[0]!;

export function getInboxFeature(id: InboxFeatureId): InboxFeature {
  const feature = INBOX_FEATURES.find((item) => item.id === id);
  if (!feature) return DEFAULT_INBOX_FEATURE;
  return feature;
}
