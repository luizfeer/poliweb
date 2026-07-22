# Plano 09 — SEO técnico, acessibilidade, analytics e newsletter (polish pré-launch)

> **Pré-requisito:** Planos 05–08 concluídos. Volume de conteúdo real (negócios + classifieds + transparência) suficiente pra ter o que indexar.

## 1. Contexto

Antes do soft launch, o portal precisa estar **encontrável** (Google), **acessível** (WCAG AA), **mensurável** (analytics LGPD-friendly) e **viral** (newsletter automática). Esta sprint não adiciona feature nova — fecha a base técnica que faltou nas sprints anteriores.

**Decisões estratégicas:**
- **Plausible self-hosted ou Vercel Analytics**, nunca Google Analytics (LGPD + cookies).
- **Newsletter via Resend** com double opt-in obrigatório. Audience por cidade.
- **Resumo semanal IA** (reusa `lib/ai/` do plano 06) — vai todo domingo às 9h.
- **Schema.org JSON-LD** em toda ficha — Google entende negócio, evento, imóvel, ato oficial como entidades estruturadas.
- **Lighthouse mobile alvo:** perf ≥ 90, a11y ≥ 95, SEO ≥ 95, best-practices ≥ 95.

## 2. Tabelas e RLS

### Newsletter

Migration `20260501XXXXXX_newsletter_audit.sql`:

- [ ] `newsletter_subscribers`: `id`, `city_id`, `email`, `confirmed_at`, `unsubscribed_at`, `source`, `consent_text_version`
- [ ] Único `(city_id, email)` quando `unsubscribed_at IS NULL`
- [ ] `newsletter_consent_history`: opt-in/out com `email`, `event`, `ip_hash`, `user_agent_hash`, `created_at`
- [ ] `newsletter_campaigns`: campanhas enviadas
- [ ] RLS: SELECT só admin; INSERT via Server Action/cron

### LGPD

- [ ] RPC `delete_user_data(profile_id)` — anonimiza dados do usuário sem quebrar histórico operacional.
- [ ] `/painel/perfil/privacidade` — excluir conta e exportar dados.

## 3. Server-side

- `apps/web/app/sitemap.ts` com rotas estáticas e dinâmicas.
- `apps/web/app/robots.ts` bloqueando `/painel/` e `/api/`.
- `apps/web/lib/seo/structured-data.ts` para JSON-LD.
- Newsletter double opt-in em `apps/web/lib/newsletter/`.
- Analytics LGPD-friendly em tabela própria quando Plausible/Vercel não estiver configurado.
- ISR em listagens públicas com `revalidate = 60`.
- Skip-to-content no layout root.

## 4. UI público

Rotas novas:
- `/newsletter/confirmar`
- `/newsletter/cancelar`
- `/sobre`
- `/anuncie`
- `/privacidade`
- `/termos`
- `/contato`

Componentes:
- `components/marketing/NewsletterCTA`
- `components/marketing/ConsentBanner`
- `components/marketing/ShareButtons`
- `components/seo/JsonLdScript`
- `components/a11y/SkipToContent`

## 5. UI painel

- `/painel/cidade/newsletter`
- `/painel/cidade/newsletter/assinantes`
- `/painel/cidade/newsletter/campanhas`
- `/painel/cidade/newsletter/consentimentos`
- `/painel/cidade/analytics`
- `/painel/cidade/analytics/eventos`
- `/painel/super/saude-tecnica`

## 6. Definition of Done

### SEO
- [ ] `sitemap.xml` gerado e acessível
- [ ] `robots.txt` correto
- [ ] JSON-LD base
- [ ] Meta tags e canonical base

### Newsletter
- [ ] Double opt-in funcionando
- [ ] Unsubscribe 1-click
- [ ] Auditoria LGPD em subscribe/confirm/unsubscribe
- [ ] Página de privacidade no perfil

### Analytics
- [ ] Tabela `analytics_events`
- [ ] Dashboard admin inicial
- [ ] Sem cookies de terceiros por padrão

### Acessibilidade
- [ ] Skip-to-content presente
- [ ] Botões de ícone com `aria-label`
- [ ] Formulários com labels

### Performance
- [ ] ISR em listagens públicas críticas
- [ ] `next/image` em imagens reais novas

### Davia
- [ ] `seo-newsletter.html`
- [ ] `mermaids/newsletter-flow.mmd`
- [ ] `data/seo-checklist.json`

### Build & qualidade
- [ ] `pnpm lint`
- [ ] `pnpm build`
- [ ] Smoke em `.claude/plans/09-resultados.md`

## 7. Próximo passo

Plano 10 — **Soft launch operacional + ads ativados**.
