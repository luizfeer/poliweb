import { hasConsentPurpose } from '@/lib/privacy/client-consent';

export type HimetricaIdentifyPayload = {
  name?: string;
  email?: string;
  metadata?: Record<string, unknown>;
};

declare global {
  interface Window {
    himetrica?: {
      track: (eventName: string, props?: Record<string, unknown>) => void;
      identify: (payload: HimetricaIdentifyPayload) => void;
    };
  }
}

export {};

export function himetricaTrack(eventName: string, props?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  if (!hasConsentPurpose('analytics')) return;
  window.himetrica?.track(eventName, props);
}

export function himetricaIdentify(payload: HimetricaIdentifyPayload): void {
  if (typeof window === 'undefined') return;
  if (!hasConsentPurpose('analytics')) return;
  window.himetrica?.identify(payload);
}
