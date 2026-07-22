import type { Ionicons } from '@expo/vector-icons';

export type InboxThreadKind = 'ai' | 'merchant' | 'order' | 'system' | 'promotion';

export type InboxFeatureId = 'assistant' | 'merchant' | 'order' | 'notifications' | 'promotions';

export type InboxFeature = {
  id: InboxFeatureId;
  kind: InboxThreadKind;
  title: string;
  storyLabel: string;
  subtitle: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
  background: string;
  route: string;
  status: 'live' | 'soon';
  bullets: string[];
};

export type InboxThread = {
  id: string;
  kind: InboxThreadKind;
  title: string;
  subtitle: string;
  /** ISO ms, usado para ordenacao. */
  updatedAt: number;
  unreadCount: number;
  /** Identifica origem: usado pelo handler de tap. */
  payload?:
    | { kind: 'ai'; sessionId: string }
    | { kind: 'merchant'; merchantId: string }
    | { kind: 'order'; orderId: string }
    | { kind: 'system'; notificationId: string }
    | { kind: 'promotion'; promotionId: string };
  pinned?: boolean;
  featureId?: InboxFeatureId;
  /** Placeholder/em-breve: thread informativo, abre uma previa da conversa. */
  comingSoon?: boolean;
};
