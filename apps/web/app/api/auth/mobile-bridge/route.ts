import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';

const bodySchema = z.object({
  access_token: z.string().min(10),
  refresh_token: z.string().min(10),
});

function safeNext(raw: string | null, origin: string): string {
  if (raw && raw.startsWith('/') && !raw.startsWith('//')) {
    return `${origin}${raw}`;
  }
  return `${origin}/painel`;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const access_token =
    request.headers.get('x-access-token') ??
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ??
    '';
  const refresh_token = request.headers.get('x-refresh-token') ?? '';
  const next = safeNext(searchParams.get('next'), origin);

  if (!access_token || !refresh_token) {
    return NextResponse.redirect(next, 302);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.setSession({ access_token, refresh_token });
  if (error) {
    return NextResponse.redirect(`${origin}/entrar?erro=bridge`, 302);
  }

  await syncProfileFromMetadata();
  return NextResponse.redirect(next, 302);
}

async function syncProfileFromMetadata(): Promise<void> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
    const fullName = pickString(metadata, ['full_name', 'name']);
    const avatarUrl = pickString(metadata, ['avatar_url', 'picture']);
    if (!fullName && !avatarUrl) return;

    const { data: current } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', user.id)
      .maybeSingle();

    const patch: { full_name?: string; avatar_url?: string } = {};
    if (fullName && !current?.full_name) patch.full_name = fullName;
    if (avatarUrl && !current?.avatar_url) patch.avatar_url = avatarUrl;
    if (Object.keys(patch).length === 0) return;

    await supabase.from('profiles').update(patch).eq('id', user.id);
  } catch {
    // sync de perfil nunca deve bloquear login
  }
}

function pickString(obj: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
}

export async function POST(request: NextRequest) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: 'invalid_body',
        issues: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.setSession({
    access_token: parsed.data.access_token,
    refresh_token: parsed.data.refresh_token,
  });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 401 });
  }

  await syncProfileFromMetadata();
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
