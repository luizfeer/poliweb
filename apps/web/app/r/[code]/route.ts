import { NextResponse } from 'next/server';
import {
  REF_COOKIE_MAX_AGE,
  REF_COOKIE_NAME,
  sanitizeReferralCode,
} from '@/lib/referral';

type Params = {
  params: Promise<{ code: string }>;
};

export const dynamic = 'force-dynamic';

// Bots de preview (servir HTML com OG). NÃO incluir "whatsapp" — o WhatsApp
// in-app browser usa UA "WhatsApp/..." mas o crawler de preview da Meta usa
// "facebookexternalhit". Se botar "whatsapp" aqui, usuários clicando no link
// dentro do app ficam presos na página estática em vez de serem redirecionados.
const CRAWLER_UA = /facebookexternalhit|facebot|twitterbot|telegrambot|linkedinbot|slackbot|discordbot|googlebot|bingbot|applebot/i;

function isCrawler(userAgent: string | null): boolean {
  return !!userAgent && CRAWLER_UA.test(userAgent);
}

export async function GET(request: Request, { params }: Params) {
  const { code } = await params;
  const sanitized = sanitizeReferralCode(code);
  const origin = new URL(request.url).origin;

  if (!sanitized) {
    return NextResponse.redirect(`${origin}/`);
  }

  const targetUrl = `${origin}/cadastro`;
  const userAgent = request.headers.get('user-agent');

  if (isCrawler(userAgent)) {
    const inviteUrl = `${origin}/r/${sanitized}`;
    const title = 'Conheça o Portal Carmelitano';
    const description =
      'Receba um convite para entrar no portal de Carmo do Rio Claro: comércio local, eventos, serviços, comunidade e sorteios da cidade.';

    const html = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${inviteUrl}" />
    <meta property="og:site_name" content="Portal Carmelitano" />
    <meta property="og:locale" content="pt_BR" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
  </head>
  <body>
    <main>
      <h1>${title}</h1>
      <p>${description}</p>
      <p><a href="${targetUrl}">Entrar no Portal Carmelitano</a></p>
    </main>
  </body>
</html>`;

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const response = NextResponse.redirect(targetUrl, { status: 302 });
  response.cookies.set(REF_COOKIE_NAME, sanitized, {
    maxAge: REF_COOKIE_MAX_AGE,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
  });

  return response;
}
