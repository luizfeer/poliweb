# WhatsApp Hub

Integração oficial com **Meta WhatsApp Cloud API**. Dois usos:

1. **Outbound transacional** — Server Actions chamam `enqueueTemplate()`, worker dispara em ~1min.
2. **Inbound assistente** — webhook persiste mensagens, worker IA (futuro) responde usando `lib/ai/city-agent-client`.

## Estrutura

```
lib/whatsapp/
  types.ts            tipos compartilhados
  meta-client.ts      wrapper da Graph API (server-only)
  outbound.ts         enqueueTemplate(), resolveChannel(), normalize()
  sync-templates.ts   diff local↔Meta, cria/atualiza no Meta
  templates/
    index.ts          TEMPLATES[] + helpers
    *.ts              cada template como módulo TS
```

## Setup (1× por canal)

### 1. Verificações na Meta (UI — sem API)

1. Meta Business Manager → verificar negócio (CNPJ, docs). **Leva 1-3 semanas.**
2. Criar app em developers.facebook.com → adicionar produto "WhatsApp".
3. Registrar número, fazer OTP. Anotar `phone_number_id` e `waba_id`.
4. Configurar método de pagamento.
5. Gerar **System User Token** permanente (não use temp token).

### 2. Env vars

```env
# Webhook
WA_VERIFY_TOKEN=string-aleatoria-longa     # você inventa, cola no Meta na hora de configurar webhook
META_WA_APP_SECRET=...                     # App Secret do app Meta (pra HMAC do webhook)

# Envio
META_WA_ACCESS_TOKEN=EAAG...               # System User Token (não expira)

# Worker
WA_WORKER_TOKEN=outra-string-aleatoria     # opcional: pra disparar worker manualmente via curl
```

### 3. Inserir canal no banco

```sql
insert into wa_channels (
  city_id, kind, display_name, waba_id, phone_number_id,
  display_number, meta_secret_ref, webhook_verify_token
) values (
  '<uuid-carmo>', 'transactional', 'Carmo Local',
  '<waba_id>', '<phone_number_id>',
  '+5535999999999', 'META_WA_ACCESS_TOKEN', '<mesmo-valor-de-WA_VERIFY_TOKEN>'
);
```

### 4. Deploy das edge functions

```bash
supabase functions deploy wa-webhook --no-verify-jwt
supabase functions deploy wa-outbound-worker
```

`--no-verify-jwt` no webhook é necessário — Meta não manda JWT. A segurança vem da assinatura HMAC.

### 5. Configurar webhook na Meta

- URL: `https://<project>.supabase.co/functions/v1/wa-webhook`
- Verify token: o valor de `WA_VERIFY_TOKEN`
- Subscribe em: `messages`

### 6. Sync de templates

```bash
pnpm tsx apps/web/scripts/wa-sync-templates.ts <channel_id>
```

Templates novos vão pra Meta como `pending`. Aprovação leva de 1min a 24h.

### 7. Cron do worker

No Supabase dashboard → Database → Cron → New job:

```sql
select net.http_post(
  url := 'https://<project>.supabase.co/functions/v1/wa-outbound-worker',
  headers := jsonb_build_object(
    'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
  )
);
```

Schedule: `* * * * *` (a cada minuto).

## Uso em Server Action

```ts
import { enqueueTemplate, resolveChannel } from '@/lib/whatsapp/outbound';

export async function approveBusinessClaim(claimId: string) {
  // ... aprovação ...
  const channel = await resolveChannel({ cityId, kind: 'transactional' });
  await enqueueTemplate({
    channelId: channel.id,
    to: claim.requester_phone,
    templateName: 'claim_aprovado',
    variables: { '1': claim.requester_name, '2': business.name },
    relatedEntityType: 'business',
    relatedEntityId: business.id,
    dedupKey: `claim_aprovado:business:${business.id}`,
  });
}
```

## Mudando texto de um template

A Meta **não permite editar body** de template aprovado. O caminho é:

1. Crie um novo template com sufixo de versão: `claim_aprovado_v2.ts`.
2. Sync → aguarda aprovação.
3. Atualize o `templateName` no Server Action que usa.
4. Depois de 1 semana sem uso, delete o antigo via `meta.deleteTemplate('claim_aprovado')`.

## Debug

- **Webhook não está chegando?** Veja `wa_webhook_log` (últimos 7 dias).
- **Template rejeitado?** `wa_templates.rejected_reason` + rodar sync de novo.
- **Mensagem falhou?** `wa_messages` com `status='failed'` traz `error_code` + `error_message`.
- **Quality rating?** `wa_channels.quality_rating` — rode `meta.getPhoneNumberInfo()` num cron diário pra atualizar.
- **Testar envio manual:**

  ```bash
  curl -X POST "https://<project>.supabase.co/functions/v1/wa-outbound-worker" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
  ```

## Roadmap

- [x] Migration + tabelas
- [x] Meta client + templates como código
- [x] Webhook (handshake + assinatura HMAC + persistência)
- [x] Worker outbound com retry exponencial
- [ ] **Próximo:** painel admin `/painel/super/whatsapp` (logs, fila, quality)
- [ ] Worker IA inbound: `blocksToWhatsapp(blocks)` + integração com `city-agent-client`
- [ ] Opt-in flow no painel do cidadão
- [ ] Marketing campaigns (segmentação + dispatcher)
