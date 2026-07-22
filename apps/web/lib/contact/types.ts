export const CONTACT_SUBMISSION_TYPES = [
  'erro-telefone',
  'correcao',
  'pauta',
  'parceria',
  'imprensa',
  'assinatura',
  'pesca',
  'anuncio',
  'comercio',
  'turismo',
  'passagens',
  'outro',
] as const;

export type ContactSubmissionType = (typeof CONTACT_SUBMISSION_TYPES)[number];
