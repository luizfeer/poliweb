'use client';

import type { UploadedMedia } from './actions';

export type DirectUploadToken = {
  token: string;
  expiresAt: number;
  processorUrl: string;
  citySlug: string;
  entityType: string;
  entityId: string;
  role: string;
  unique: boolean;
  maxBytes: number;
};

export type ProcessedUploadResponse = {
  bucket: string;
  storagePath: string;
  cdnUrl: string;
  contentType: string;
  sizeBytes: number;
  checksumSha256: string;
  originalFilename: string;
  originalContentType?: string;
  originalSizeBytes?: number;
  width?: number | null;
  height?: number | null;
  thumbnail?: {
    storagePath: string;
    cdnUrl: string;
    contentType: string;
    sizeBytes: number;
    width?: number | null;
    height?: number | null;
  } | null;
};

export type DirectUploadProgress = {
  loaded: number;
  total: number;
  percent: number;
};

export type DirectUploadOptions = {
  file: File;
  token: DirectUploadToken;
  onProgress?: (progress: DirectUploadProgress) => void;
  signal?: AbortSignal;
};

export async function uploadDirectToProcessor(options: DirectUploadOptions): Promise<ProcessedUploadResponse> {
  const { file, token, onProgress, signal } = options;

  if (file.size > token.maxBytes) {
    throw new Error(
      `Arquivo maior que o limite (${(token.maxBytes / (1024 * 1024)).toFixed(0)}MB).`,
    );
  }

  // IMPORTANT: append os campos ANTES do arquivo. fastify-multipart so popula
  // file.fields com campos que aparecem antes do arquivo no stream.
  const formData = new FormData();
  formData.append('citySlug', token.citySlug);
  formData.append('entityType', token.entityType);
  formData.append('entityId', token.entityId);
  formData.append('role', token.role);
  formData.append('unique', String(token.unique));
  formData.append('file', file);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${token.processorUrl}/v1/process`);
    xhr.setRequestHeader('Authorization', `Bearer t:${token.token}`);

    xhr.upload.addEventListener('progress', (event) => {
      if (!onProgress) return;
      const total = event.total || file.size;
      const loaded = event.loaded;
      const percent = total > 0 ? Math.min(99, Math.round((loaded / total) * 100)) : 0;
      onProgress({ loaded, total, percent });
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const parsed = JSON.parse(xhr.responseText) as ProcessedUploadResponse;
          onProgress?.({ loaded: file.size, total: file.size, percent: 100 });
          resolve(parsed);
        } catch (error) {
          reject(error instanceof Error ? error : new Error('Resposta invalida do media-processor.'));
        }
        return;
      }
      reject(parseProcessorError(xhr));
    });

    xhr.addEventListener('error', () => reject(new Error('Falha de rede no upload.')));
    xhr.addEventListener('abort', () => reject(new Error('Upload cancelado.')));

    if (signal) {
      if (signal.aborted) {
        xhr.abort();
        return;
      }
      signal.addEventListener('abort', () => xhr.abort(), { once: true });
    }

    xhr.send(formData);
  });
}

function parseProcessorError(xhr: XMLHttpRequest): Error {
  try {
    const body = JSON.parse(xhr.responseText) as { error?: string };
    if (body?.error) return new Error(`media-processor: ${body.error} (HTTP ${xhr.status})`);
  } catch {
    // ignore
  }
  return new Error(`media-processor HTTP ${xhr.status}`);
}

export type DirectUploadCompletion = {
  processed: ProcessedUploadResponse;
  media?: UploadedMedia;
};
