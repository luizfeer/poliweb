export const PRIVACY_POLICY_VERSION = '2026-05-15';
export const CONSENT_STORAGE_KEY = 'carmo:consent-v2';
const LEGACY_STORAGE_KEY = 'carmo:consent-v1';

export type ConsentPurpose =
  | 'analytics'
  | 'ads_measurement'
  | 'marketing_email'
  | 'push_notifications'
  | 'ai_processing'
  | 'public_listing';

export type ConsentPreferences = {
  version: string;
  analytics: boolean;
  ads_measurement: boolean;
  marketing_email: boolean;
  push_notifications: boolean;
  ai_processing: boolean;
  public_listing: boolean;
  updatedAt: string;
};

export const optionalConsentPurposes: ConsentPurpose[] = [
  'analytics',
  'ads_measurement',
  'marketing_email',
  'push_notifications',
  'ai_processing',
  'public_listing',
];

export function emptyConsentPreferences(): ConsentPreferences {
  return {
    version: PRIVACY_POLICY_VERSION,
    analytics: false,
    ads_measurement: false,
    marketing_email: false,
    push_notifications: false,
    ai_processing: false,
    public_listing: false,
    updatedAt: new Date(0).toISOString(),
  };
}

export function getConsentPreferences(): ConsentPreferences | null {
  if (typeof window === 'undefined') return null;

  const current = window.localStorage.getItem(CONSENT_STORAGE_KEY);
  if (current) {
    try {
      const parsed = JSON.parse(current) as Partial<ConsentPreferences>;
      return {
        ...emptyConsentPreferences(),
        ...parsed,
        version: parsed.version ?? PRIVACY_POLICY_VERSION,
      };
    } catch {
      return null;
    }
  }

  const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!legacy) return null;

  const granted = legacy === 'accepted';
  return {
    ...emptyConsentPreferences(),
    analytics: granted,
    ads_measurement: granted,
    updatedAt: new Date().toISOString(),
  };
}

export function hasConsentPurpose(purpose: ConsentPurpose): boolean {
  return getConsentPreferences()?.[purpose] === true;
}

export function saveConsentPreferences(
  preferences: Omit<ConsentPreferences, 'version' | 'updatedAt'>,
): ConsentPreferences {
  const next = {
    ...preferences,
    version: PRIVACY_POLICY_VERSION,
    updatedAt: new Date().toISOString(),
  };

  window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent('carmo:consent', { detail: next }));
  return next;
}
