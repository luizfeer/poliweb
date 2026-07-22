/**
 * Cookie de captura de indicação.
 * Setado em /r/[code]; lido em signUpAction; expira em 30 dias.
 */
export const REF_COOKIE_NAME = 'ref_code';
export const REF_COOKIE_MAX_AGE = 30 * 24 * 60 * 60;
export const OAUTH_SIGNUP_PENDING_COOKIE_NAME = 'oauth_signup_pending';

const CODE_REGEX = /^[A-Z0-9]{4,10}$/;

export function sanitizeReferralCode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const code = raw.trim().toUpperCase().slice(0, 10);
  return CODE_REGEX.test(code) ? code : null;
}
