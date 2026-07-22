# Prompt — Sprint 11: Finalizar Produção + Smoke Test

> Cole junto com `.claude/prompts/00-onboarding.md` quando voltar para finalizar.

---

## Contexto

Sprint 11 está **99% pronto**. Todo backend implementado e todas as páginas conectadas a dados reais. Faltam apenas 4 etapas operacionais para fechar:

1. Gerar e configurar `CRON_SECRET` em Vercel
2. Agendar cron job diário
3. E2E smoke test com 3 contas reais
4. Monitoramento pós-deploy

**Status atual (commit `9addebd`):**
- ✅ Migration aplicada ao Supabase (`20260504120000_referral_pontos_sorteios`)
- ✅ Tipos regenerados (`database.types.ts`)
- ✅ Workarounds removidos (`sprint-11-types.ts` deletado)
- ✅ Backend queries criadas:
  - `lib/raffles/queries.ts::listMyEntries()` 
  - `lib/points/admin-queries.ts` (3 funções)
- ✅ Pages conectadas a dados reais:
  - `/painel/cidadao/sorteios` → mostra sorteios reais do usuário
  - `/painel/cidade/pontos` → ranking, summary, transações reais
- ✅ Build limpo, types corretos, sem warnings

---

## Ordem de Execução (~ 1h estimado)

### Etapa 1: Gerar CRON_SECRET (5 min)

```bash
# Gerar token seguro
CRON_SECRET=$(openssl rand -base64 32)
echo "CRON_SECRET=$CRON_SECRET"

# Copiar saída — você vai colar em Vercel
```

**O que esperar:** String de ~44 caracteres alfanuméricos (ex: `abc123...xyz789==`)

---

### Etapa 2: Configurar Vercel Environment (10 min)

1. Abrir https://vercel.com/hail-mary/hail-mary/settings/environment-variables
2. Adicionar nova variável:
   - Name: `CRON_SECRET`
   - Value: (colar o output do openssl)
   - Scopes: Production ✓
3. Salvar

**Verificar:** A variável deve aparecer com valor oculto `●●●●●●●●`

---

### Etapa 3: Agendar Cron Job (10 min)

**Opção A — Vercel Cron (recomendado):**

1. Abrir `vercel.json` na raiz do projeto
2. Adicionar/atualizar seção `crons`:
   ```json
   {
     "crons": [
       { "path": "/api/cron/draw-raffles", "schedule": "0 3 * * *" }
     ]
   }
   ```
   - `0 3 * * *` = 03:00 UTC diariamente (horário de Brasília: 00:00 — madrugada)
   - Se preferir outro horário: use [crontab.guru](https://crontab.guru) para converter
3. Fazer commit e push (Vercel ativa automaticamente)

**Verificar:**
- Ir para Deploy Settings → Crons
- Deve aparecer: `/api/cron/draw-raffles — Daily at 03:00 UTC`

**Opção B — cron-job.org (backup):**

Se Vercel Cron falhar, usar cron-job.org como fallback:
1. Ir para https://cron-job.org
2. Create → Cronjob
3. URL: `https://hail-mary.vercel.app/api/cron/draw-raffles`
4. Cron Expression: `0 3 * * *`
5. Headers: `Authorization: Bearer ${CRON_SECRET}`
6. Salvar

---

### Etapa 4: Smoke Test E2E (30 min)

**Pré-requisitos:**
- App rodando em produção (ou staging com dados reais)
- 3 contas de teste abertas (browser incógnito para cada uma)

**Fluxo:**

#### Conta A: Criar referral code

1. Login em `/painel/cidadao`
2. Ir para `/painel/cidadao/indicar`
3. Copiar URL do tipo `https://hail-mary.com.br/r/ABC123`
4. Anotar o código: `ABC123`
5. Ver saldo atual de pontos (pré-check)

#### Conta B: Usar referral no signup

1. Em aba incógnita, abrir `https://hail-mary.com.br/r/ABC123` (copiada de A)
2. Deve redirecionar para `/cadastro`
3. Cookie `ref_code` deve estar setado (checar em DevTools → Application → Cookies)
4. Completar signup (nome, email, senha, cidade = Carmo)
5. **Verificar imediatamente após signup:**
   - Conta B no painel: deve ter `20 pts` (signup_bonus) + `20 pts` (referral_received) = **40 pts**
   - Conta A no painel: deve ter `+100 pts` adicionados (referral_earned)

#### Contas A e B: Entrar em sorteio

1. Ir para `/sorteios` (pública)
2. Encontrar um sorteio ativo
3. Entrar com 1-5 entradas (custo: 50 pts por entrada)
4. Verificar no painel `/painel/cidadao/pontos`:
   - Saldo decrementado
   - Transação aparece no histórico com "Entrada em sorteio"
5. Ir para `/painel/cidadao/sorteios`:
   - Sorteio aparece em "Meus sorteios"
   - Mostra número de entradas e pontos gastos

#### Conta Admin: Sortear manualmente

1. Login como city_admin em `/painel/cidade/sorteios`
2. Encontrar o sorteio que A e B entraram
3. Clicar em "Sortear" (ou chamar manualmente via `/api/cron/draw-raffles`)
4. **Se há entradas:**
   - RPC `draw_raffle_winner()` escolhe vencedor aleatoriamente (ponderado por `entries_count`)
   - Status muda para `drawn`
   - `winner_profile_id` é setado
   - Email enviado ao vencedor (via Resend)
5. **Se não há entradas:**
   - RPC retorna `null`
   - Status muda para `cancelled`
   - Nenhum email

#### Verificação de Email

1. Checar inbox de **A** e **B** (usar emails de teste reais)
2. Se um deles venceu:
   - Subject: `🎉 Você ganhou no sorteio...`
   - Body: título, prêmio, instruções de contato
   - Links funcionam e apontam para `/sorteios/[slug]`
3. Ir para `/sorteios/[slug]` como vencedor:
   - Deve mostrar banner "🎉 VOCÊ GANHOU"
   - Mensagem: "A equipe da prefeitura entrará em contato..."

---

### Etapa 5: Verificar Audit Log (5 min)

1. Ir para `/painel/super/auditoria` (super_admin)
2. Filtrar por ação: `raffle.draw_winner`
3. Deve aparecer entrada:
   ```
   Action: raffle.draw_winner
   Entity ID: [sorteio-id]
   Changes: winner_profile_id = [uuid], status = drawn
   Timestamp: [agora]
   ```

---

## Checklist de Finalização

```
Produção:
- [ ] CRON_SECRET gerado (openssl rand -base64 32)
- [ ] CRON_SECRET adicionado em Vercel env vars (Production scope)
- [ ] vercel.json editado com crons section
- [ ] Commit feito com vercel.json
- [ ] Deploy completo em Vercel
- [ ] Cron job aparece em Vercel Dashboard → Crons

Smoke Test (3 contas):
- [ ] Conta A: /painel/cidadao/indicar acessível, código copiável
- [ ] Conta B: /r/[code] redireciona para /cadastro
- [ ] Conta B pós-signup: +40 pts (20 welcome + 20 referral_received)
- [ ] Conta A pós-referral: +100 pts (referral_earned)
- [ ] Ambas podem entrar em sorteio ativo
- [ ] Transações aparecem em /painel/cidadao/pontos
- [ ] Sorteios aparecem em /painel/cidadao/sorteios com dados reais
- [ ] Admin consegue sortear (via painel ou cron manual)
- [ ] Vencedor recebe email
- [ ] /sorteios/[slug] mostra "VOCÊ GANHOU" se winner
- [ ] Audit log registra draw_raffle_winner

Monitoramento:
- [ ] /painel/super/saude-tecnica mostra última execução do cron
- [ ] Não há erros em Vercel Function Logs
- [ ] Banco respondendo normalm (nenhuma query timeout)
```

---

## Comandos Úteis (Copiar-Colar)

**Gerar CRON_SECRET:**
```bash
openssl rand -base64 32
```

**Testar cron manualmente (local, com auth):**
```bash
curl -X GET "http://localhost:3000/api/cron/draw-raffles" \
  -H "Authorization: Bearer seu-cron-secret-aqui"
```

**Testar em produção (precisa do CRON_SECRET real):**
```bash
curl -X GET "https://hail-mary.vercel.app/api/cron/draw-raffles" \
  -H "Authorization: Bearer $CRON_SECRET"
```

---

## Armadilhas Conhecidas

1. **CRON_SECRET vazio em dev**
   - Em `.env.local` dev, `CRON_SECRET` é opcional (route retorna 200 mesmo sem auth)
   - Em produção (NODE_ENV=production), é obrigatório
   - Se esquecer em Vercel: cron retorna 500

2. **Timezone do email**
   - Email é enviado com `appUrl` do `.env` (`NEXT_PUBLIC_APP_URL`)
   - Hora do sorteio é em UTC
   - Timestamp de `drawn_at` é também UTC
   - Conversão para localtime é no frontend (Intl.DateTimeFormat)

3. **Redis vs In-Memory (dedup)**
   - `lib/raffles/dedup.ts` usa in-memory Map para dedup de eventos em < 60s
   - Em cluster com múltiplas instâncias, alguns eventos podem passar
   - Para produção high-volume, considerar Redis (opcional pra MVP)

4. **Raffle com 0 entradas**
   - RPC `draw_raffle_winner()` retorna `null`
   - Código marca como `cancelled` automaticamente
   - Nenhum email é enviado
   - Admin pode ignorar ou investigar (baixa participação)

5. **Limite soft de entradas por usuário**
   - Validado em frontend (`max_entries_per_profile`)
   - RLS não força (pode ser driblado com request direto)
   - Para lock hard, adicionar check em RPC (future improvement)

---

## Próximo Sprint

Após validar smoke test com sucesso, próximas prioridades (escolher 1):

- **Sprint 12** — PWA + Web Push: notificações nativas (baixo custo, alto engajamento)
- **Sprint 15** — Multi-cidade: ativar Capitólio + Guapé
- **Sprint 16** — Workers de scrapers: transparência em tempo real

Recomendação: **Sprint 12 → Push Notifications** (complementa bem pontos/sorteios, pronto pra implementar)

---

## Comando para Começar a Próxima Sessão

Cole JUNTO COM `00-onboarding.md`:

```
[cola 00-onboarding.md]

[cola 11-referral-finalizacao-producao.md]

Vamos finalizar Sprint 11. Comece pela Etapa 1 (gerar CRON_SECRET) e siga a checklist.
```

