function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asRecordArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => Boolean(asRecord(item)))
    : [];
}

export function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

export function googlePhotoUrls(value: unknown): string[] {
  const record = asRecord(value);
  if (!record) return [];

  return [...asRecordArray(record.imported_photos), ...asRecordArray(record.pending_photos)]
    .map((photo) => {
      const cdnUrl = photo.cdn_url;
      if (typeof cdnUrl === 'string' && cdnUrl.length > 0) return cdnUrl;
      const url = photo.url;
      return typeof url === 'string' && url.length > 0 ? url : null;
    })
    .filter((url): url is string => Boolean(url));
}

export function firstImage(values: (string | null | undefined)[]): string | null {
  return values.find((value): value is string => typeof value === 'string' && value.length > 0) ?? null;
}

type AttractionCoverSource = {
  cover_url: string | null;
  photos?: unknown;
  google_photos?: unknown;
  og_image_url?: string | null;
  og_square_image_url?: string | null;
};

function uniqueUrls(urls: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const url of urls) {
    if (!url || seen.has(url)) continue;
    seen.add(url);
    result.push(url);
  }
  return result;
}

/** Fotos reais da ficha — OG só entra se não houver galeria (igual à home). */
export function resolveAttractionPhotos(row: AttractionCoverSource): string[] {
  const ogUrls = new Set(
    [row.og_image_url, row.og_square_image_url].filter(
      (url): url is string => typeof url === 'string' && url.length > 0,
    ),
  );

  const gallery = uniqueUrls([
    ...asStringArray(row.photos),
    ...googlePhotoUrls(row.google_photos),
    ...(row.cover_url && !ogUrls.has(row.cover_url) ? [row.cover_url] : []),
  ]);

  if (gallery.length > 0) return gallery;

  return uniqueUrls([
    row.cover_url,
    row.og_square_image_url,
    row.og_image_url,
  ].filter((url): url is string => typeof url === 'string' && url.length > 0));
}

export function resolveAttractionCover(row: AttractionCoverSource): string | null {
  return resolveAttractionPhotos(row)[0] ?? null;
}
