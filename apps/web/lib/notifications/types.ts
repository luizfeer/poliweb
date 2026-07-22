import type { Database, Json } from '@/lib/supabase/database.types';

export type NotificationAudience = Database['public']['Enums']['notification_audience'];
export type NotificationPriority = Database['public']['Enums']['notification_priority'];
export type NotificationType =
  | 'lead.received'
  | 'approval.pending'
  | 'approval.approved'
  | 'approval.rejected'
  | 'approval.needs_changes'
  | 'comment.received'
  | 'review.pending'
  | 'photo.pending'
  | 'business_claim.pending'
  | 'business_report.received'
  | 'system.summary'
  | 'city_alert.email_enabled';

export type NotificationRow = Database['public']['Tables']['notifications']['Row'];

export type CreateNotificationInput = {
  recipientProfileId: string;
  cityId: string;
  audience?: NotificationAudience;
  type: NotificationType;
  priority?: NotificationPriority;
  title: string;
  body?: string | null;
  targetUrl: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Json;
  sendEmail?: boolean;
  pushPayload?: Json;
};

export type NotifyCityAdminsInput = Omit<CreateNotificationInput, 'recipientProfileId' | 'audience' | 'cityId'> & {
  cityId: string;
};
