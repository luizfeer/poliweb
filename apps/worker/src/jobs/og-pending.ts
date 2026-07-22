import type { WorkerEnv } from '../runtime/env.js';
import { logger } from '../runtime/logger.js';
import { createCounters, toJobResult } from '../runtime/result.js';
import { PostgrestClient } from '../persistence/postgrest.js';
import { renderOgImage } from '../og/render.js';
import { uploadToR2, deleteFromR2 } from '../media/r2.js';

type OgJob = {
  id: string;
  city_id: string;
  entity_type: string;
  entity_id: string;
  status: string;
  attempts: number;
  max_attempts: number;
};

type CityRow = {
  id: string;
  slug: string;
  name: string;
};

function clipText(text: string, max: number): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string');
  return [];
}

async function fetchHeroBuffer(heroUrl: string | null): Promise<Buffer | null> {
  if (!heroUrl) return null;
  try {
    const res = await fetch(heroUrl, { signal: AbortSignal.timeout(10_000) });
    if (res.ok) return Buffer.from(await res.arrayBuffer());
  } catch {}
  return null;
}

async function deleteOldOg(db: PostgrestClient, table: string, id: string): Promise<void> {
  const rows = await db.selectRows<{ og_image_url?: string | null; og_square_image_url?: string | null }>(
    table,
    { id },
    'og_image_url,og_square_image_url',
  );
  const oldUrls = [rows[0]?.og_image_url, rows[0]?.og_square_image_url].filter(
    (value): value is string => Boolean(value),
  );
  for (const oldUrl of oldUrls) {
    try {
      const pathMatch = oldUrl.match(/\/og\/.*$/);
      if (pathMatch) {
        await deleteFromR2(pathMatch[0].replace(/^\//, ''));
      }
    } catch {
      // ignora erro de deleção, continua com upload novo
    }
  }
}

async function renderAndUploadOg(input: {
  city: CityRow;
  entityType: string;
  entityId: string;
  version: string;
  title: string;
  tagline: string;
  typeLabel: string;
  heroBuffer: Buffer | null;
}): Promise<{ ogImageUrl: string; ogSquareImageUrl: string }> {
  const entityTypeSlug = input.entityType.replace(/_/g, '-');
  const [landscapeBuffer, squareBuffer] = await Promise.all([
    renderOgImage({
      title: input.title,
      tagline: input.tagline,
      typeLabel: input.typeLabel,
      cityName: input.city.name,
      heroBuffer: input.heroBuffer,
      variant: 'landscape',
    }),
    renderOgImage({
      title: input.title,
      tagline: input.tagline,
      typeLabel: input.typeLabel,
      cityName: input.city.name,
      heroBuffer: input.heroBuffer,
      variant: 'square',
    }),
  ]);

  const [landscape, square] = await Promise.all([
    uploadToR2({
      buffer: landscapeBuffer,
      storagePath: `${input.city.slug}/og/${entityTypeSlug}/${input.entityId}/${input.version}/og.webp`,
      contentType: 'image/webp',
    }),
    uploadToR2({
      buffer: squareBuffer,
      storagePath: `${input.city.slug}/og/${entityTypeSlug}/${input.entityId}/${input.version}/whatsapp.jpg`,
      contentType: 'image/jpeg',
    }),
  ]);

  return { ogImageUrl: landscape.cdnUrl, ogSquareImageUrl: square.cdnUrl };
}

export async function runOgPending(env: WorkerEnv) {
  const db = new PostgrestClient({
    supabaseUrl: env.supabaseUrl,
    serviceRoleKey: env.supabaseServiceRoleKey,
  });
  const counters = createCounters();

  const jobs = await db.selectRows<OgJob>(
    'og_image_jobs',
    { status: 'pending' },
    'id,city_id,entity_type,entity_id,status,attempts,max_attempts',
  );

  logger.info('og:pending jobs', { count: jobs.length });

  for (const job of jobs) {
    counters.processed += 1;

    if (job.attempts >= job.max_attempts) {
      await db.updateRows(
        'og_image_jobs',
        { id: job.id },
        {
          status: 'failed',
          error: 'max attempts exceeded',
          updated_at: new Date().toISOString(),
        },
      );
      counters.skipped += 1;
      continue;
    }

    await db.updateRows(
      'og_image_jobs',
      { id: job.id },
      {
        status: 'processing',
        attempts: job.attempts + 1,
        updated_at: new Date().toISOString(),
      },
    );

    try {
      await processJob(db, job);
      counters.updated += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('og:pending job failed', { jobId: job.id, error: message });
      counters.errors.push(message);
      await db.updateRows(
        'og_image_jobs',
        { id: job.id },
        {
          status: 'pending',
          error: message,
          updated_at: new Date().toISOString(),
        },
      );
    }
  }

  return toJobResult(counters);
}

async function processJob(db: PostgrestClient, job: OgJob) {
  switch (job.entity_type) {
    case 'business':
      return processBusiness(db, job);
    case 'attraction':
      return processGeneric(
        db,
        job,
        'attractions',
        'name',
        'cover_url',
        'photos',
        'description',
        'Atração',
      );
    case 'accommodation':
      return processGeneric(
        db,
        job,
        'accommodations',
        'name',
        'cover_url',
        'photos',
        'description',
        'Hospedagem',
      );
    case 'restaurant':
      return processGeneric(
        db,
        job,
        'restaurants',
        'name',
        'cover_url',
        'photos',
        'description',
        'Restaurante',
      );
    case 'fishing_guide':
      return processFishingGuide(db, job);
    case 'tourism_guide':
      return processGeneric(
        db,
        job,
        'tourism_guides',
        'name',
        'cover_url',
        'photos',
        'description',
        'Guia',
      );
    case 'property':
      return processProperty(db, job);
    case 'church':
      return processGeneric(
        db,
        job,
        'churches',
        'name',
        'cover_url',
        null,
        'description',
        'Igreja',
      );
    case 'ferry_route':
      return processFerryRoute(db, job);
    case 'community_group':
      return processCommunityGroup(db, job);
    case 'classified':
      return processClassified(db, job);
    case 'event':
      return processGeneric(
        db,
        job,
        'events',
        'title',
        'cover_url',
        'photos',
        'description',
        'Evento',
      );
    case 'lost_pet':
      return processGeneric(
        db,
        job,
        'lost_pets',
        'pet_name',
        'cover_url',
        'photos',
        'description',
        'Pet',
      );
    case 'lost_and_found':
      return processGeneric(
        db,
        job,
        'lost_and_found',
        'item_description',
        'cover_url',
        null,
        'location',
        'Achados e perdidos',
      );
    case 'obituary':
      return processGeneric(
        db,
        job,
        'obituaries',
        'full_name',
        'photo_url',
        null,
        'family_message',
        'Obituário',
      );
    case 'health_campaign':
      return processGeneric(
        db,
        job,
        'health_campaigns',
        'title',
        'cover_url',
        null,
        'description',
        'Saúde',
      );
    default:
      throw new Error(`Unsupported entity_type: ${job.entity_type}`);
  }
}

async function processBusiness(db: PostgrestClient, job: OgJob) {
  type Row = {
    id: string;
    city_id: string;
    slug: string;
    name: string;
    short_description: string | null;
    description: string | null;
    cover_url: string | null;
    photos: unknown;
    address: string | null;
  };

  const [rows, cityRows] = await Promise.all([
    db.selectRows<Row>(
      'businesses',
      { id: job.entity_id, city_id: job.city_id },
      'id,city_id,slug,name,short_description,description,cover_url,photos,address',
    ),
    db.selectRows<CityRow>('cities', { id: job.city_id }, 'id,slug,name'),
  ]);

  const row = rows[0];
  const city = cityRows[0];
  if (!row || !city) throw new Error('Business not found');

  const photoUrls = asStringArray(row.photos);
  const heroBuffer = await fetchHeroBuffer(row.cover_url ?? photoUrls[0] ?? null);

  const categoryRows = await db.selectRows<{ name: string }>(
    'business_category_assignments',
    { business_id: row.id, is_primary: 'eq.true' },
    'business_categories!inner(name)',
  );
  const primaryCategory =
    (categoryRows[0] as unknown as { business_categories?: { name?: string } } | undefined)
      ?.business_categories?.name ?? 'Comércio';

  const tagline = clipText(
    row.short_description ??
      row.description ??
      (row.address ? `${row.address} — ${city.name}` : `Encontre em ${city.name}`),
    142,
  );

  await deleteOldOg(db, 'businesses', row.id);
  const uploaded = await renderAndUploadOg({
    city,
    entityType: job.entity_type,
    entityId: row.id,
    version: job.id,
    title: row.name,
    tagline,
    typeLabel: primaryCategory,
    heroBuffer,
  });

  await db.updateRows(
    'businesses',
    { id: row.id },
    {
      og_image_url: uploaded.ogImageUrl,
      og_square_image_url: uploaded.ogSquareImageUrl,
      updated_at: new Date().toISOString(),
    },
  );
  await finishJob(db, job.id, uploaded.ogImageUrl, uploaded.ogSquareImageUrl);
  logger.info('og:pending business done', {
    jobId: job.id,
    entityId: row.id,
    cdnUrl: uploaded.ogImageUrl,
  });
}

async function processGeneric(
  db: PostgrestClient,
  job: OgJob,
  table: string,
  nameField: string,
  coverField: string,
  photosField: string | null,
  descField: string | null,
  fallbackTypeLabel: string,
) {
  const selectFields = [nameField, coverField, descField].filter(Boolean).join(',');
  const [rows, cityRows] = await Promise.all([
    db.selectRows<Record<string, unknown>>(
      table,
      { id: job.entity_id, city_id: job.city_id },
      `id,city_id,${selectFields}${photosField ? ',' + photosField : ''}`,
    ),
    db.selectRows<CityRow>('cities', { id: job.city_id }, 'id,slug,name'),
  ]);

  const row = rows[0];
  const city = cityRows[0];
  if (!row || !city) throw new Error(`${table} not found`);

  const name = String(row[nameField] ?? '');
  const coverUrl = row[coverField] ? String(row[coverField]) : null;
  const photoUrls = photosField ? asStringArray(row[photosField]) : [];
  const heroBuffer = await fetchHeroBuffer(coverUrl ?? photoUrls[0] ?? null);

  const description = descField ? String(row[descField] ?? '') : '';
  const tagline = clipText(description || `Encontre em ${city.name}`, 142);

  await deleteOldOg(db, table, String(row.id));
  const uploaded = await renderAndUploadOg({
    city,
    entityType: job.entity_type,
    entityId: String(row.id),
    version: job.id,
    title: name,
    tagline,
    typeLabel: fallbackTypeLabel,
    heroBuffer,
  });

  const patch: Record<string, string> = {
    og_image_url: uploaded.ogImageUrl,
    og_square_image_url: uploaded.ogSquareImageUrl,
  };
  if (['attractions', 'accommodations', 'restaurants', 'tourism_guides', 'churches', 'events'].includes(table)) {
    patch.updated_at = new Date().toISOString();
  }

  await db.updateRows(table, { id: String(row.id) }, patch);
  await finishJob(db, job.id, uploaded.ogImageUrl, uploaded.ogSquareImageUrl);
  logger.info(`og:pending ${table} done`, {
    jobId: job.id,
    entityId: String(row.id),
    cdnUrl: uploaded.ogImageUrl,
  });
}

async function processFishingGuide(db: PostgrestClient, job: OgJob) {
  type Row = {
    id: string;
    city_id: string;
    slug: string;
    full_name: string;
    photo_url: string | null;
    about: string | null;
  };

  const [rows, cityRows] = await Promise.all([
    db.selectRows<Row>(
      'fishing_guides',
      { id: job.entity_id, city_id: job.city_id },
      'id,city_id,slug,full_name,photo_url,about',
    ),
    db.selectRows<CityRow>('cities', { id: job.city_id }, 'id,slug,name'),
  ]);

  const row = rows[0];
  const city = cityRows[0];
  if (!row || !city) throw new Error('Fishing guide not found');

  const heroBuffer = await fetchHeroBuffer(row.photo_url);
  const tagline = clipText(row.about ?? `Guia de pesca em ${city.name}`, 142);

  await deleteOldOg(db, 'fishing_guides', row.id);
  const uploaded = await renderAndUploadOg({
    city,
    entityType: job.entity_type,
    entityId: row.id,
    version: job.id,
    title: row.full_name,
    tagline,
    typeLabel: 'Pesca',
    heroBuffer,
  });

  await db.updateRows(
    'fishing_guides',
    { id: row.id },
    {
      og_image_url: uploaded.ogImageUrl,
      og_square_image_url: uploaded.ogSquareImageUrl,
    },
  );
  await finishJob(db, job.id, uploaded.ogImageUrl, uploaded.ogSquareImageUrl);
  logger.info('og:pending fishing_guide done', {
    jobId: job.id,
    entityId: row.id,
    cdnUrl: uploaded.ogImageUrl,
  });
}

async function processProperty(db: PostgrestClient, job: OgJob) {
  type Row = {
    id: string;
    city_id: string;
    slug: string;
    title: string;
    cover_url: string | null;
    photos: unknown;
    description: string | null;
    price: number | null;
    rent_price: number | null;
  };

  const [rows, cityRows] = await Promise.all([
    db.selectRows<Row>(
      'properties',
      { id: job.entity_id, city_id: job.city_id },
      'id,city_id,slug,title,cover_url,photos,description,price,rent_price',
    ),
    db.selectRows<CityRow>('cities', { id: job.city_id }, 'id,slug,name'),
  ]);

  const row = rows[0];
  const city = cityRows[0];
  if (!row || !city) throw new Error('Property not found');

  const photoUrls = asStringArray(row.photos);
  const heroBuffer = await fetchHeroBuffer(row.cover_url ?? photoUrls[0] ?? null);

  let tagline = row.description ?? '';
  const price = row.price ?? row.rent_price;
  if (!tagline && price) {
    tagline = `A partir de R$ ${price.toLocaleString('pt-BR')} — ${city.name}`;
  } else if (!tagline) {
    tagline = `Imóvel em ${city.name}`;
  }

  await deleteOldOg(db, 'properties', row.id);
  const uploaded = await renderAndUploadOg({
    city,
    entityType: job.entity_type,
    entityId: row.id,
    version: job.id,
    title: row.title,
    tagline: clipText(tagline, 142),
    typeLabel: 'Imóvel',
    heroBuffer,
  });

  await db.updateRows(
    'properties',
    { id: row.id },
    {
      og_image_url: uploaded.ogImageUrl,
      og_square_image_url: uploaded.ogSquareImageUrl,
      updated_at: new Date().toISOString(),
    },
  );
  await finishJob(db, job.id, uploaded.ogImageUrl, uploaded.ogSquareImageUrl);
  logger.info('og:pending property done', {
    jobId: job.id,
    entityId: row.id,
    cdnUrl: uploaded.ogImageUrl,
  });
}

async function processFerryRoute(db: PostgrestClient, job: OgJob) {
  type Row = {
    id: string;
    city_id: string;
    slug: string;
    name: string;
    cover_url: string | null;
    description: string | null;
    endpoint_a_label: string | null;
    endpoint_b_label: string | null;
  };

  const [rows, cityRows] = await Promise.all([
    db.selectRows<Row>(
      'ferry_routes',
      { id: job.entity_id, city_id: job.city_id },
      'id,city_id,slug,name,cover_url,description,endpoint_a_label,endpoint_b_label',
    ),
    db.selectRows<CityRow>('cities', { id: job.city_id }, 'id,slug,name'),
  ]);

  const row = rows[0];
  const city = cityRows[0];
  if (!row || !city) throw new Error('Ferry route not found');

  const heroBuffer = await fetchHeroBuffer(row.cover_url);
  const endpoints = [row.endpoint_a_label, row.endpoint_b_label].filter(Boolean).join(' ↔ ');
  const tagline = clipText(
    row.description ??
      (endpoints ? `${endpoints} — ${city.name}` : `Horários de balsa em ${city.name}`),
    142,
  );

  await deleteOldOg(db, 'ferry_routes', row.id);
  const uploaded = await renderAndUploadOg({
    city,
    entityType: job.entity_type,
    entityId: row.id,
    version: job.id,
    title: row.name,
    tagline,
    typeLabel: 'Balsa',
    heroBuffer,
  });

  await db.updateRows(
    'ferry_routes',
    { id: row.id },
    {
      og_image_url: uploaded.ogImageUrl,
      og_square_image_url: uploaded.ogSquareImageUrl,
      updated_at: new Date().toISOString(),
    },
  );
  await finishJob(db, job.id, uploaded.ogImageUrl, uploaded.ogSquareImageUrl);
  logger.info('og:pending ferry_route done', {
    jobId: job.id,
    entityId: row.id,
    cdnUrl: uploaded.ogImageUrl,
  });
}

async function processCommunityGroup(db: PostgrestClient, job: OgJob) {
  type Row = {
    id: string;
    city_id: string;
    slug: string;
    name: string;
    type: 'collective' | 'association' | 'project' | 'whatsapp_group';
    category: string;
    short_description: string | null;
    description: string | null;
    cover_url: string | null;
    thumbnail_url: string | null;
  };

  const [rows, cityRows] = await Promise.all([
    db.selectRows<Row>(
      'community_groups',
      { id: job.entity_id, city_id: job.city_id },
      'id,city_id,slug,name,type,category,short_description,description,cover_url,thumbnail_url',
    ),
    db.selectRows<CityRow>('cities', { id: job.city_id }, 'id,slug,name'),
  ]);

  const row = rows[0];
  const city = cityRows[0];
  if (!row || !city) throw new Error('Community group not found');

  const heroBuffer = await fetchHeroBuffer(row.cover_url ?? row.thumbnail_url);
  const tagline = clipText(
    row.short_description ?? row.description ?? `${row.category} em ${city.name}`,
    142,
  );
  const typeLabel = row.type === 'whatsapp_group' ? 'Grupo de WhatsApp' : 'Comunidade';

  await deleteOldOg(db, 'community_groups', row.id);
  const uploaded = await renderAndUploadOg({
    city,
    entityType: job.entity_type,
    entityId: row.id,
    version: job.id,
    title: row.name,
    tagline,
    typeLabel,
    heroBuffer,
  });

  await db.updateRows(
    'community_groups',
    { id: row.id },
    {
      og_image_url: uploaded.ogImageUrl,
      updated_at: new Date().toISOString(),
    },
  );
  await finishJob(db, job.id, uploaded.ogImageUrl, uploaded.ogSquareImageUrl);
  logger.info('og:pending community_group done', {
    jobId: job.id,
    entityId: row.id,
    cdnUrl: uploaded.ogImageUrl,
  });
}

async function processClassified(db: PostgrestClient, job: OgJob) {
  type Row = {
    id: string;
    city_id: string;
    slug: string;
    title: string;
    description: string | null;
    price: number | null;
    category_label: string | null;
    cover_url: string | null;
    photos: unknown;
  };

  const [rows, cityRows] = await Promise.all([
    db.selectRows<Row>(
      'classifieds',
      { id: job.entity_id, city_id: job.city_id },
      'id,city_id,slug,title,description,price,category_label,cover_url,photos',
    ),
    db.selectRows<CityRow>('cities', { id: job.city_id }, 'id,slug,name'),
  ]);

  const row = rows[0];
  const city = cityRows[0];
  if (!row || !city) throw new Error('Classified not found');

  const photoUrls = asStringArray(row.photos);
  const heroBuffer = await fetchHeroBuffer(row.cover_url ?? photoUrls[0] ?? null);
  const price = row.price
    ? row.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : null;
  const tagline = clipText(
    row.description ?? (price ? `${price} em ${city.name}` : `Classificado em ${city.name}`),
    142,
  );

  await deleteOldOg(db, 'classifieds', row.id);
  const uploaded = await renderAndUploadOg({
    city,
    entityType: job.entity_type,
    entityId: row.id,
    version: job.id,
    title: row.title,
    tagline,
    typeLabel: row.category_label ?? 'Classificado',
    heroBuffer,
  });

  await db.updateRows(
    'classifieds',
    { id: row.id },
    {
      og_image_url: uploaded.ogImageUrl,
      og_square_image_url: uploaded.ogSquareImageUrl,
    },
  );
  await finishJob(db, job.id, uploaded.ogImageUrl, uploaded.ogSquareImageUrl);
  logger.info('og:pending classified done', {
    jobId: job.id,
    entityId: row.id,
    cdnUrl: uploaded.ogImageUrl,
  });
}

async function finishJob(
  db: PostgrestClient,
  jobId: string,
  cdnUrl: string,
  squareCdnUrl: string,
) {
  await db.updateRows(
    'og_image_jobs',
    { id: jobId },
    {
      status: 'done',
      og_image_url: cdnUrl,
      og_square_image_url: squareCdnUrl,
      processed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  );
}
