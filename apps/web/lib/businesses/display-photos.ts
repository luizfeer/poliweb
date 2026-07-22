import type { Business } from './types';

/** URLs na ordem do hero público: capa primeiro, depois `photos`, sem duplicatas. */
export function getBusinessDisplayPhotoUrls(business: Pick<Business, 'coverUrl' | 'photos'>): string[] {
  const raw = [
    ...(business.coverUrl ? [business.coverUrl] : []),
    ...(business.photos ? [...business.photos].reverse() : []),
  ];
  return Array.from(new Set(raw.filter(Boolean)));
}
