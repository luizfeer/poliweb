/**
 * Economia central de pontos do portal.
 * Toda action que credita/debita pontos importa daqui — fonte única da verdade.
 */
export const POINTS = {
  signup_bonus: 20,
  referral_received: 20,
  referral_earned: 100,
  classified_posted: 5,
  event_submitted: 10,
  lost_found_resolved: 5,
  review_written: 5,
} as const;

export type PointReason =
  | 'signup_bonus'
  | 'referral_received'
  | 'referral_earned'
  | 'classified_posted'
  | 'event_submitted'
  | 'lost_found_resolved'
  | 'review_written'
  | 'raffle_entry'
  | 'admin_adjustment';

export const REASON_LABELS: Record<PointReason, string> = {
  signup_bonus: 'Bônus de boas-vindas',
  referral_received: 'Você foi indicado por alguém',
  referral_earned: 'Você indicou alguém que se cadastrou',
  classified_posted: 'Classificado publicado',
  event_submitted: 'Evento submetido',
  lost_found_resolved: 'Achado/perdido resolvido',
  review_written: 'Avaliação escrita',
  raffle_entry: 'Entrada em sorteio',
  admin_adjustment: 'Ajuste administrativo',
};
