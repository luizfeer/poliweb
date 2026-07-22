import 'server-only';
import type { Property } from './types';

type NotifyInquiryInput = {
  property: Property;
  requesterName: string;
  requesterPhone?: string;
  message?: string;
};

type NotifyReviewInput = {
  propertyTitle: string;
  decision: 'approved' | 'rejected' | 'needs_changes';
  reason?: string;
};

export async function notifyPropertyInquiry(input: NotifyInquiryInput): Promise<void> {
  void input;
  // Resend entra aqui quando a conta transacional estiver configurada.
}

export async function notifyPropertyReviewDecision(input: NotifyReviewInput): Promise<void> {
  void input;
  // Mantido isolado para nao acoplar actions de revisao ao provedor de email.
}
