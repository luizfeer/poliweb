import { createHash, randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const require = createRequire(resolve(import.meta.dirname, '..', 'apps', 'web', 'package.json'));
const { PutObjectCommand, S3Client } = require('@aws-sdk/client-s3');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GOOGLE_KEY = process.env.GOOGLE_PLACES_API_KEY ?? process.env.GOOGLE_MAPS_API_KEY;
const R2 = {
  endpoint: process.env.R2_ENDPOINT,
  bucket: process.env.R2_BUCKET,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  publicBaseUrl: (process.env.R2_PUBLIC_BASE_URL ?? process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL ?? '').replace(/\/$/, ''),
};
const DRY_RUN = process.argv.includes('--dry-run');

for (const [name, value] of Object.entries({
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  GOOGLE_PLACES_API_KEY: GOOGLE_KEY,
  R2_ENDPOINT: R2.endpoint,
  R2_BUCKET: R2.bucket,
  R2_ACCESS_KEY_ID: R2.accessKeyId,
  R2_SECRET_ACCESS_KEY: R2.secretAccessKey,
  R2_PUBLIC_BASE_URL: R2.publicBaseUrl,
})) {
  if (!value) {
    console.error(`Falta env var: ${name}`);
    process.exit(1);
  }
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const s3 = new S3Client({
  region: 'auto',
  endpoint: R2.endpoint,
  credentials: { accessKeyId: R2.accessKeyId, secretAccessKey: R2.secretAccessKey },
});

async function downloadGooglePhoto(name) {
  const url = new URL(`https://places.googleapis.com/v1/${name}/media`);
  url.searchParams.set('maxWidthPx', '1600');
  url.searchParams.set('key', GOOGLE_KEY);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Google ${res.status}: ${await res.text().catch(() => '')}`);
  const contentType = res.headers.get('content-type') ?? 'image/jpeg';
  const bytes = Buffer.from(await res.arrayBuffer());
  return { bytes, contentType };
}

function extFromContentType(contentType) {
  if (contentType.includes('png')) return 'png';
  if (contentType.includes('webp')) return 'webp';
  return 'jpg';
}

async function uploadToR2({ bytes, contentType, storagePath }) {
  const checksumHex = createHash('sha256').update(bytes).digest('hex').toUpperCase();
  await s3.send(
    new PutObjectCommand({
      Bucket: R2.bucket,
      Key: storagePath,
      Body: bytes,
      ContentType: contentType,
      ChecksumSHA256: Buffer.from(checksumHex, 'hex').toString('base64'),
    }),
  );
  return {
    storagePath,
    cdnUrl: `${R2.publicBaseUrl}/${storagePath}`,
    checksumSha256: checksumHex,
  };
}

async function processAttraction(row) {
  const importSrc = row.google_photos ?? {};
  const approved = Array.isArray(importSrc.approved_photos) ? importSrc.approved_photos : [];
  const pending = Array.isArray(importSrc.pending_photos) ? importSrc.pending_photos : [];
  const existingImported = Array.isArray(importSrc.imported_photos) ? importSrc.imported_photos : [];
  const importedByName = new Map(existingImported.map((p) => [p?.name, p]));

  const todo = approved.filter((name) => {
    const existing = importedByName.get(name);
    return !existing || !existing.cdn_url;
  });

  if (todo.length === 0) {
    console.log(`  [skip] ${row.slug}: nada a fazer`);
    return;
  }

  console.log(`  ${row.slug}: ${todo.length} foto(s) a importar`);

  const pendingByName = new Map(pending.map((p) => [p?.name, p]));
  const newImported = [...existingImported];

  for (const [idx, name] of todo.entries()) {
    const attribution = pendingByName.get(name)?.attribution ?? null;
    try {
      console.log(`    [${idx + 1}/${todo.length}] baixando ${name.slice(-20)}…`);
      const { bytes, contentType } = await downloadGooglePhoto(name);
      const storagePath = `${row.city_slug}/attraction/${row.id}/gallery/${randomUUID()}.${extFromContentType(contentType)}`;

      if (DRY_RUN) {
        console.log(`    [dry] uparia para r2://${R2.bucket}/${storagePath} (${bytes.length} bytes)`);
        continue;
      }

      const uploaded = await uploadToR2({ bytes, contentType, storagePath });

      const { data: asset, error: assetErr } = await supabase
        .from('media_assets')
        .upsert(
          {
            city_id: row.city_id,
            uploaded_by_profile_id: null,
            provider: 'r2',
            bucket: R2.bucket,
            storage_path: uploaded.storagePath,
            cdn_url: uploaded.cdnUrl,
            original_filename: `google-attraction-${row.id}-${newImported.length + 1}.${extFromContentType(contentType)}`,
            content_type: contentType,
            size_bytes: bytes.length,
            checksum_sha256: uploaded.checksumSha256,
            width: null,
            height: null,
            alt_text: attribution ? `Foto do Google. Credito: ${attribution}` : 'Foto importada do Google.',
            metadata: { backfill: true, google_photo_name: name },
          },
          { onConflict: 'bucket,storage_path' },
        )
        .select('id, cdn_url')
        .single();
      if (assetErr || !asset) throw assetErr ?? new Error('media_assets insert vazio');

      const { error: linkErr } = await supabase.from('media_links').upsert(
        {
          city_id: row.city_id,
          asset_id: asset.id,
          entity_type: 'attraction',
          entity_id: row.id,
          role: 'gallery',
          position: newImported.length,
          is_primary: false,
        },
        { onConflict: 'asset_id,entity_type,entity_id,role' },
      );
      if (linkErr) throw linkErr;

      newImported.push({
        name,
        role: 'gallery',
        attribution,
        asset_id: asset.id,
        cdn_url: asset.cdn_url,
        imported_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error(`    [erro] ${name.slice(-20)}: ${err.message ?? err}`);
      throw err;
    }
  }

  if (DRY_RUN) return;

  const nextGooglePhotos = {
    ...importSrc,
    imported_photos: newImported,
    updated_at: new Date().toISOString(),
  };

  const { error: updateErr } = await supabase
    .from('attractions')
    .update({ google_photos: nextGooglePhotos })
    .eq('id', row.id);
  if (updateErr) throw updateErr;

  console.log(`  [ok] ${row.slug}: imported_photos agora tem ${newImported.length} item(s)`);
}

async function main() {
  console.log(`Backfill de fotos Google → R2${DRY_RUN ? ' (DRY RUN)' : ''}`);

  const { data, error } = await supabase
    .from('attractions')
    .select('id, slug, city_id, google_photos, cities(slug)')
    .not('google_photos->approved_photos', 'is', null);

  if (error) {
    console.error('Falha ao listar atracoes:', error.message);
    process.exit(1);
  }

  const candidates = (data ?? [])
    .map((row) => ({
      id: row.id,
      slug: row.slug,
      city_id: row.city_id,
      city_slug: row.cities?.slug,
      google_photos: row.google_photos,
    }))
    .filter((row) => {
      const approved = row.google_photos?.approved_photos ?? [];
      const imported = row.google_photos?.imported_photos ?? [];
      if (!Array.isArray(approved) || approved.length === 0) return false;
      const importedNames = new Set(
        (Array.isArray(imported) ? imported : [])
          .filter((p) => p?.cdn_url)
          .map((p) => p?.name),
      );
      return approved.some((name) => !importedNames.has(name));
    });

  console.log(`Atracoes a processar: ${candidates.length}`);
  for (const row of candidates) {
    if (!row.city_slug) {
      console.warn(`  [warn] ${row.slug}: sem city_slug, pulando`);
      continue;
    }
    await processAttraction(row);
  }
  console.log('Concluido.');
}

main().catch((err) => {
  console.error('Falha geral:', err);
  process.exit(1);
});
