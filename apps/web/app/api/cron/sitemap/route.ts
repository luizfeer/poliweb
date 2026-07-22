import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resolvePublicSiteOrigin } from '@/lib/seo/site-origin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ ok: false, error: 'CRON_SECRET is required' }, { status: 500 });
  }
  if (secret) {
    const authorization = request.headers.get('authorization');
    if (authorization !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
    }
  }

  revalidatePath('/sitemap.xml');
  revalidatePath('/robots.txt');

  const siteUrl = resolvePublicSiteOrigin();
  const sitemapUrl = `${siteUrl}/sitemap.xml`;
  const host = siteUrl.replace(/^https?:\/\//, '');

  const recent = await collectRecentUrls(siteUrl);

  const results: Record<string, unknown> = { sitemap: sitemapUrl, host, urls: recent.length };

  const indexNowKey = process.env.INDEXNOW_KEY;
  if (indexNowKey && recent.length > 0) {
    try {
      const res = await fetch('https://api.indexnow.org/IndexNow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          host,
          key: indexNowKey,
          keyLocation: `${siteUrl}/${indexNowKey}.txt`,
          urlList: recent.slice(0, 10000),
        }),
      });
      results.indexnow = { status: res.status };
    } catch (err) {
      results.indexnow = { error: (err as Error).message };
    }
  } else {
    results.indexnow = { skipped: indexNowKey ? 'no-urls' : 'no-key' };
  }

  return NextResponse.json({ ok: true, ...results });
}

async function collectRecentUrls(siteUrl: string): Promise<string[]> {
  try {
    const supabase = await createClient();
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [biz, ev, cls, props, attr, acc, rest, guides, real, ch, raffles, ferries] = await Promise.all([
      supabase.from('businesses').select('slug').eq('status', 'published').gte('updated_at', since).limit(500),
      supabase.from('events').select('slug').eq('status', 'published').gte('updated_at', since).limit(500),
      supabase.from('classifieds').select('slug, type').eq('status', 'published').eq('review_status', 'approved').gte('updated_at', since).limit(500),
      supabase.from('properties').select('slug').eq('status', 'published').eq('review_status', 'approved').gte('updated_at', since).limit(500),
      supabase.from('attractions').select('slug').eq('status', 'published').gte('updated_at', since).limit(500),
      supabase.from('accommodations').select('slug').eq('status', 'published').gte('updated_at', since).limit(500),
      supabase.from('restaurants').select('slug').eq('status', 'published').gte('updated_at', since).limit(500),
      supabase.from('tourism_guides').select('slug').eq('status', 'published').gte('updated_at', since).limit(500),
      supabase.from('realtors').select('slug').eq('status', 'published').gte('updated_at', since).limit(500),
      supabase.from('churches').select('slug').eq('status', 'published').gte('updated_at', since).limit(500),
      supabase.from('raffles').select('slug').eq('status', 'active').gte('updated_at', since).limit(500),
      supabase.from('ferry_routes').select('slug').eq('active', true).gte('updated_at', since).limit(500),
    ]);

    const urls: string[] = [siteUrl, `${siteUrl}/sitemap.xml`];
    for (const r of biz.data ?? []) urls.push(`${siteUrl}/comercio/negocio/${r.slug}`);
    for (const r of ev.data ?? []) urls.push(`${siteUrl}/comunidade/agenda/${r.slug}`);
    for (const r of cls.data ?? []) urls.push(`${siteUrl}${classifiedPath(r.type)}/${r.slug}`);
    for (const r of props.data ?? []) urls.push(`${siteUrl}/imoveis/${r.slug}`);
    for (const r of attr.data ?? []) urls.push(`${siteUrl}/turismo/o-que-fazer/${r.slug}`);
    for (const r of acc.data ?? []) urls.push(`${siteUrl}/turismo/onde-ficar/${r.slug}`);
    for (const r of rest.data ?? []) urls.push(`${siteUrl}/turismo/onde-comer/${r.slug}`);
    for (const r of guides.data ?? []) urls.push(`${siteUrl}/turismo/guias/${r.slug}`);
    for (const r of real.data ?? []) urls.push(`${siteUrl}/imobiliarias/${r.slug}`);
    for (const r of ch.data ?? []) urls.push(`${siteUrl}/comunidade/igrejas/${r.slug}`);
    for (const r of raffles.data ?? []) urls.push(`${siteUrl}/sorteios/${r.slug}`);
    for (const r of ferries.data ?? []) urls.push(`${siteUrl}/balsas/${r.slug}`);

    return urls;
  } catch {
    return [];
  }
}

function classifiedPath(type: string): string {
  if (type === 'vehicle') return '/classificados/veiculos';
  if (type === 'job') return '/classificados/vagas';
  if (type === 'service') return '/classificados/servicos';
  if (type === 'item') return '/classificados/itens';
  return '/classificados/buscar';
}
