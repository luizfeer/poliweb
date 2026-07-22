# Cofre de segredos (`app_secrets`)

Cofre cifrado de credenciais **server-side** (Anthropic, Resend, service_role do Supabase, etc.) que permite rotacionar sem rebuildar / sem redeploy.

> ⚠️ **Não é pra mobile.** O mobile usa [`mobile_config`](../../../apps/mobile/lib/remote-config.ts) (público, sem cripto).

## Como funciona

- Valores cifrados com **AES-256-GCM** usando uma master key vinda do env (`APP_SECRETS_MASTER_KEY`).
- Banco guarda só ciphertext + nonce. Quem tiver acesso ao DB sem a master key não consegue ler.
- App lê via [`getSecret(key)`](./vault.ts) com cache em memória de 60s.
- Rotação no painel `/painel/super/segredos` bumpa `key_version` e invalida cache. Próximo `getSecret()` pega o novo valor.

## Bootstrap

1. **Gera a master key** (uma vez, guarda no 1Password/Bitwarden):

   ```powershell
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

2. **Coloca no env** (dev + prod):

   ```
   APP_SECRETS_MASTER_KEY=<base64 de 32 bytes>
   ```

3. **Cadastra os segredos** no painel `/painel/super/segredos` (UPPER_SNAKE_CASE).

⚠️ Se perder a master key, **todos** os segredos cifrados viram lixo. Não tem recovery.

## Uso no código

```ts
import { getSecret } from '@/lib/secrets/vault';

// Em Server Action / RSC / Route Handler:
const anthropicKey = await getSecret('ANTHROPIC_API_KEY');
if (!anthropicKey) throw new Error('ANTHROPIC_API_KEY ausente no cofre');

const anthropic = new Anthropic({ apiKey: anthropicKey });
```

### Cache

- Cacheia pelo **tempo de vida do processo** (sem TTL). Em serverless = até cold start; em servidor longevo = até restart.
- Após rotação no painel, o cache é invalidado **na instância que fez a rotação**. Outras instâncias seguem com o valor velho até reiniciarem.
- Premissa: se uma chave vaza, você rotaciona ela **na origem** (Anthropic/Resend/etc) — aí o valor velho cacheado deixa de funcionar lá, sem dano.
- Pra forçar leitura fresca: `getSecret(key, { bypassCache: true })`.

### Escopo por cidade

```ts
const stripeKey = await getSecret('STRIPE_SECRET_KEY', { cityId: city.id });
```

Se a chave for global, usa `cityId: null` (ou omite).

## Migração de envs existentes

Pra mover um secret do `.env` pro cofre:

1. Cadastra no painel com o mesmo nome (`ANTHROPIC_API_KEY`)
2. Troca `process.env.ANTHROPIC_API_KEY` por `await getSecret('ANTHROPIC_API_KEY')` no código (lembra de tornar a função `async`)
3. Remove do `.env` em produção (mantém em dev se quiser)
4. Rotaciona a chave original — a velha continua valendo até você desligar lá na origem

## O que NÃO botar no cofre

- ❌ `NEXT_PUBLIC_*` — esses vão pro client de qualquer jeito
- ❌ `APP_SECRETS_MASTER_KEY` — é ela que decifra o cofre, não pode estar dentro
- ❌ `DATABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL` — bootstrap, precisa antes do cofre subir
- ❌ Chaves do mobile — usa `mobile_config`

## RLS

- Leitura: só `super_admin` via painel. App lê via `service_role` (não passa por RLS).
- Escrita: só `super_admin`.
