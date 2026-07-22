# Resultados 09 - SEO, a11y, analytics e newsletter

Data: 2026-05-01

## Implementado

- Plano salvo em `.claude/plans/09-seo-a11y-newsletter.md`.
- Migration `20260501143000_newsletter_audit_analytics.sql`:
  - `newsletter_subscribers`
  - `newsletter_consent_history`
  - `newsletter_campaigns`
  - `analytics_events`
  - RPC `delete_user_data(p_profile_id)`
- SEO tecnico:
  - `apps/web/app/sitemap.ts`
  - `apps/web/app/robots.ts`
  - `apps/web/app/opengraph-image.tsx`
  - metadata base no layout root
  - JSON-LD `Organization` no layout
  - helpers em `apps/web/lib/seo/structured-data.ts`
- Acessibilidade:
  - `SkipToContent` no layout root
  - formulario de newsletter com label acessivel
- Newsletter:
  - POST `/api/newsletter/subscribe`
  - Server Action para CTA
  - `/newsletter/confirmar`
  - `/newsletter/cancelar`
  - envio via Resend quando `RESEND_API_KEY` estiver configurado
  - auditoria de subscribe/confirm/unsubscribe
- UI publica:
  - `/sobre`
  - `/anuncie`
  - `/privacidade`
  - `/termos`
  - `/contato`
- UI painel:
  - `/painel/perfil/privacidade`
  - `/painel/cidade/newsletter`
  - `/painel/cidade/newsletter/assinantes`
  - `/painel/cidade/newsletter/campanhas`
  - `/painel/cidade/newsletter/consentimentos`
  - `/painel/cidade/analytics`
  - `/painel/cidade/analytics/eventos`
  - `/painel/super/saude-tecnica`
- Davia:
  - `seo-newsletter.html`
  - `mermaids/newsletter-flow.mmd`
  - `data/seo-checklist.json`
  - `data/sprints.json` atualizado

## Verificacao

- `pnpm lint`: passou.
- `pnpm build`: passou.
- `pnpm test:a11y`: nao existe no `package.json`.
- `pnpm davia:open`: falhou com `No projects found. Run 'davia init' first.`

## Pendencias conhecidas

- `pnpm test:a11y` ainda nao existe no `package.json`.
- Weekly summary automatico ainda precisa do worker/cron do plano 06.
- Plausible/Vercel Analytics nao foi conectado; a base propria `analytics_events` ficou pronta.
- Google Search Console, Bing Webmaster, SPF/DKIM/DMARC e Rich Results Test dependem de dominio/producao.
- JSON-LD por ficha dinamica ainda precisa ser conectado rota a rota; a base e helpers foram criados.
