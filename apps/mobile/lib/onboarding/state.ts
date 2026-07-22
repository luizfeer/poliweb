import * as SecureStore from 'expo-secure-store';

const ONBOARDING_KEY = 'carmelitano.onboarding_seen';
const GUEST_KEY = 'carmelitano.guest_mode';

export async function hasSeenOnboarding(): Promise<boolean> {
  try {
    const v = await SecureStore.getItemAsync(ONBOARDING_KEY);
    return v === '1';
  } catch {
    return false;
  }
}

export async function markOnboardingSeen(): Promise<void> {
  try {
    await SecureStore.setItemAsync(ONBOARDING_KEY, '1');
  } catch {
    // ignora — UX não pode quebrar por falha do secure-store
  }
}

/** Limpa as flags de onboarding/guest. Usar só em dev pra re-testar o fluxo. */
export async function resetOnboarding(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(ONBOARDING_KEY);
    await SecureStore.deleteItemAsync(GUEST_KEY);
  } catch {
    // ignora
  }
}

export async function isGuestMode(): Promise<boolean> {
  try {
    const v = await SecureStore.getItemAsync(GUEST_KEY);
    return v === '1';
  } catch {
    return false;
  }
}

export async function setGuestMode(value: boolean): Promise<void> {
  try {
    if (value) {
      await SecureStore.setItemAsync(GUEST_KEY, '1');
    } else {
      await SecureStore.deleteItemAsync(GUEST_KEY);
    }
  } catch {
    // ignora
  }
}
