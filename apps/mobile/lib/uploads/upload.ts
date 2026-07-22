import { env } from '@/lib/env';
import { supabase } from '@/lib/supabase';

import type {
  MediaRole,
  PickedAsset,
  ProcessedUpload,
  UploadResult,
  UploadTokenResponse,
} from './types';

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Sessão expirada. Entre novamente.');
  return { Authorization: `Bearer ${token}` };
}

export async function requestUploadToken(input: {
  citySlug: string;
  entityType: string;
  entityId: string;
  role: MediaRole;
}): Promise<UploadTokenResponse> {
  const headers = await authHeaders();
  const res = await fetch(`${env.webBaseUrl}/api/mobile/media/token`, {
    method: 'POST',
    headers: { ...headers, 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`token http ${res.status}: ${text.slice(0, 200)}`);
  }
  return (await res.json()) as UploadTokenResponse;
}

export async function finalizeUpload(input: {
  citySlug: string;
  entityType: string;
  entityId: string;
  role: MediaRole;
  altText?: string | null;
  processed: ProcessedUpload;
}): Promise<UploadResult> {
  const headers = await authHeaders();
  const res = await fetch(`${env.webBaseUrl}/api/mobile/media/finalize`, {
    method: 'POST',
    headers: { ...headers, 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`finalize http ${res.status}: ${text.slice(0, 200)}`);
  }
  return (await res.json()) as UploadResult;
}

type ProcessorOptions = {
  asset: PickedAsset;
  token: UploadTokenResponse;
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
};

export function uploadToProcessor(opts: ProcessorOptions): Promise<ProcessedUpload> {
  const { asset, token, onProgress, signal } = opts;
  if (asset.size != null && asset.size > token.maxBytes) {
    return Promise.reject(
      new Error(`Arquivo maior que o limite (${Math.round(token.maxBytes / 1024 / 1024)}MB).`),
    );
  }

  return new Promise<ProcessedUpload>((resolve, reject) => {
    const form = new FormData();
    form.append('citySlug', token.citySlug);
    form.append('entityType', token.entityType);
    form.append('entityId', token.entityId);
    form.append('role', token.role);
    form.append('unique', String(token.unique));
    // RN-specific file shape — não usar Blob/base64.
    form.append('file', {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      uri: asset.uri,
      name: asset.fileName,
      type: asset.mime,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${token.processorUrl}/v1/process`);
    xhr.setRequestHeader('Authorization', `Bearer t:${token.token}`);

    xhr.upload.onprogress = (event: ProgressEvent) => {
      if (!onProgress) return;
      const total = event.total || asset.size || 1;
      const pct = total > 0 ? Math.min(99, Math.round((event.loaded / total) * 100)) : 0;
      onProgress(pct);
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const parsed = JSON.parse(xhr.responseText) as ProcessedUpload;
          onProgress?.(100);
          resolve(parsed);
        } catch (err) {
          reject(err instanceof Error ? err : new Error('Resposta inválida do processor.'));
        }
        return;
      }
      reject(new Error(`processor http ${xhr.status}: ${xhr.responseText.slice(0, 200)}`));
    };
    xhr.onerror = () => reject(new Error('Falha de rede no upload.'));
    xhr.onabort = () => reject(new Error('Upload cancelado.'));

    if (signal) {
      if (signal.aborted) {
        xhr.abort();
        return;
      }
      signal.addEventListener('abort', () => xhr.abort(), { once: true });
    }

    xhr.send(form as unknown as Document);
  });
}
