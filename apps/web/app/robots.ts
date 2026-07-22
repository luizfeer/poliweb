import type { MetadataRoute } from 'next';
import { resolvePublicSiteOrigin } from '@/lib/seo/site-origin';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = resolvePublicSiteOrigin();
  const host = siteUrl.replace(/^https?:\/\//, '');

  const disallow = [
    '/painel/',
    '/api/',
    '/(auth)/',
    '/entrar',
    '/cadastro',
    '/recuperar-senha',
    '/sair',
    '/preview/',
    '/mocks/',
    '/mocs/',
    '/newsletter/cancelar',
    '/newsletter/confirmar',
    '/excluir-conta',
    '/r/',
  ];

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow,
      },
      {
        userAgent: ['Googlebot', 'Googlebot-Image', 'Googlebot-News', 'Bingbot', 'DuckDuckBot', 'Applebot'],
        allow: ['/', '/turismo/', '/comercio/', '/imoveis/', '/imobiliarias/', '/comunidade/', '/agenda/', '/classificados/', '/servicos/', '/balsas/', '/transparencia/'],
        disallow,
      },
      {
        userAgent: ['GPTBot', 'CCBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended'],
        allow: '/',
        disallow,
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host,
  };
}
