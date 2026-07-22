import { supabase } from '@/lib/supabase';
import { env } from '@/lib/env';

export type PushDevice = {
  id: string;
  platform: 'ios' | 'android' | 'web';
  device_name: string | null;
  app_version: string | null;
  last_seen_at: string;
  created_at: string;
};

export type PushCategory = {
  type: string;
  label: string;
  description: string;
  pushEnabled: boolean;
  emailEnabled: boolean;
};

export type PushState = {
  devices: PushDevice[];
  categories: PushCategory[];
};

async function authHeader(override?: string | null): Promise<Record<string, string> | null> {
  let token = override ?? null;
  if (!token) {
    const { data } = await supabase.auth.getSession();
    token = data.session?.access_token ?? null;
  }
  if (!token) return null;
  return { Authorization: `Bearer ${token}` };
}

export async function fetchPushState(accessToken?: string | null): Promise<PushState | null> {
  const headers = await authHeader(accessToken);
  if (!headers) return null;
  try {
    const res = await fetch(`${env.webBaseUrl}/api/mobile/push/state`, { headers });
    if (!res.ok) return null;
    const json = (await res.json()) as { ok: boolean } & PushState;
    if (!json.ok) return null;
    return { devices: json.devices, categories: json.categories };
  } catch {
    return null;
  }
}

export async function updatePushPreference(
  input: {
    type: string;
    pushEnabled?: boolean;
    emailEnabled?: boolean;
  },
  accessToken?: string | null,
): Promise<boolean> {
  const headers = await authHeader(accessToken);
  if (!headers) return false;
  try {
    const res = await fetch(`${env.webBaseUrl}/api/mobile/push/preferences`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function revokePushDevice(
  deviceId: string,
  accessToken?: string | null,
): Promise<boolean> {
  const headers = await authHeader(accessToken);
  if (!headers) return false;
  try {
    const res = await fetch(`${env.webBaseUrl}/api/mobile/push/device/${deviceId}`, {
      method: 'DELETE',
      headers,
    });
    return res.ok;
  } catch {
    return false;
  }
}
