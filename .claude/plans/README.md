# Planos de implementação — Carmo Local

Cada `.md` aqui é uma **especificação executável** que a IA (Claude) segue passo-a-passo para fechar uma sprint. Plano vivo: atualizar no fim do sprint com o que mudou no caminho.

## Ordem de execução (do estado atual em diante)

| Ordem | Arquivo | Tema | Pré-requisitos |
|---|---|---|---|
| 0 | `shimmying-singing-platypus.md` | Visão estratégica geral (criada no Sprint 0) | — |
| **1** | `00-auth-painel.md` | **Auth, papéis, RLS, painéis** | Migrations rodadas no Supabase |
| 2 | `01-comercio-admin.md` | Admin de comércio (merchant + city_admin), import cliqueiachei | Auth pronto |
| 3 | `02-servicos-admin.md` | Admin de serviços públicos e informações (utilities) | Auth pronto |
| 4 | `03-turismo-admin.md` | Admin de turismo (acomodações, atrações, restaurantes, pesca) | Auth pronto |
| 5 | `04-comunidade-admin.md` | Admin de comunidade (eventos, classificados, pets, obituários) | Auth pronto |
| 6 | `05-verificacao.md` | Verificação de identidade e fluxo de claims | Auth + comércio |
| 7 | `06-transparencia-ia.md` | Worker de transparência (scraper VPS + IA) | Auth pronto |
| 8 | `07-imoveis-real-estate.md` | Imóveis: imobiliárias, corretores, fichas | Auth pronto |
| 9 | `08-classificados-pesados.md` | Classificados de veículos, vagas, serviços | Comunidade |
| 10 | `09-seo-a11y-newsletter.md` | SEO técnico, acessibilidade, newsletter Resend | Conteúdo populado |
| 11 | `10-soft-launch-ads.md` | Soft launch + ativação de monetização (ads) | Tudo acima |
| **12** | **`11-referral-pontos-sorteios.md`** | **Indicação + pontos + sorteios (viralização)** | Soft launch ativo |
| 13 | `12-pwa-push-notifications.md` | PWA + notificações push (retenção) | Referral entregue |
| 14 | `13-busca-semantica.md` | Busca semântica unificada (embeddings) | PWA + conteúdo popular |
| 15 | `14-analytics-comerciante.md` | Analytics pro merchant (prova de valor pra ads) | Busca + tráfego real |
| 16 | `15-boletim-mensal.md` | Boletim mensal do negócio (IA + analytics + imagem) | Analytics + Studio |
| 17 | `16-studio-reels-remotion.md` | Studio → Reels/vídeo (Remotion) | Studio entregue |

## Notas operacionais por sprint

### Sprint 11 (em andamento)
Após aplicar a migration `20260504120000_referral_pontos_sorteios.sql` no Supabase,
regenerar tipos:
```bash
supabase gen types typescript --local > apps/web/lib/supabase/database.types.ts
```
Depois disso, **remover** `apps/web/lib/supabase/sprint-11-types.ts` e os
`@ts-expect-error sprint-11 RPC pending types regen` em:
- `apps/web/lib/points/award.ts`
- `apps/web/lib/referral/codes.ts`
- `apps/web/app/painel/cidade/sorteios/actions.ts`

Configurar `CRON_SECRET` em `.env.local` e agendar `GET /api/cron/draw-raffles`
(diário 03h, header `Authorization: Bearer ${CRON_SECRET}`).

## Convenções dos planos

Cada plano tem 6 seções fixas, nessa ordem:

1. **Contexto** — por quê e o que destrava
2. **Tabelas e RLS** — o que precisa estar no banco; políticas necessárias
3. **Server-side** — Server Actions, queries, edge functions
4. **UI público** — rotas e componentes que o visitante vê
5. **UI painel** — rotas e componentes da área logada (admin/merchant/citizen)
6. **Definition of Done** — checklist objetivo pra fechar a sprint

Cada Server Action é especificada com:
- Nome do arquivo (`app/.../actions.ts`)
- Schema Zod do input
- Quais tabelas escreve
- Quem pode chamar (RLS)
- Side effects (audit_log, IA, email)

## Como a IA deve ler

Quando o usuário disser "vamos pro plano X" ou "implementa a sprint Y":

1. Leia o plano correspondente integralmente
2. Confira os pré-requisitos e que as migrations referenciadas estão de fato rodadas
3. Use TodoWrite com os checkboxes da seção "Definition of Done"
4. Marque tarefa em `in_progress` antes de começar; `completed` só quando o build passa e a feature funciona
5. No fim, abra um commit por sub-feature lógica (não 1 commit gigante)
6. Atualize o Davia (`.davia/assets/implementation-roadmap.html`) marcando o sprint concluído
