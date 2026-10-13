# Notificações do Poliweb

O site (Quasar, em `src/`) registra o aparelho. Este serviço Fastify grava o dispositivo no PostgreSQL da API e dispara em lotes de 100 pela Expo Push API (app iOS) e por Web Push (navegador e TWA Android).

A API pública em `https://apiv4.poliwebapp.com.br` continua sendo a de sempre (Fastify + PostgreSQL). Estas rotas entram no mesmo host: o nginx encaminha só `/push` para este processo, na porta `5055`. O restante da API não muda.

Não foi feito deploy.

## Variáveis

Copie `api/.env.example` para `api/.env`.

| Variável | Obrigatória | Função |
| --- | --- | --- |
| `DATABASE_URL` | sim, em produção | PostgreSQL da API principal. A migração cria `push_devices` e `push_campaigns` nesse banco. |
| `PORT` | não | Porta do processo. Padrão `5055`. |
| `HOST` | não | Padrão `127.0.0.1`. |
| `JWT_SECRET` | para vincular o cliente logado | Mesmo segredo HS256 do `@fastify/jwt` da API. O `user_id` sai de `customerId`, `userId`, `id` ou `sub`. Admin é `role` `admin` (ou `isAdmin: true`). |
| `PUSH_ADMIN_SECRET` | não | Bearer estático que também autoriza o disparo. |
| `UPSTREAM_API_URL` | não | Padrão `https://apiv4.poliwebapp.com.br`. Se o JWT não se declarar admin, `GET /customers` com o mesmo Bearer decide. `2xx` libera o painel. |
| `CORS_ORIGINS` | não | Origens do site, separadas por vírgula. Vazio reflete qualquer origem. |
| `VAPID_PUBLIC_KEY` | sim, para navegador e Android | Chave pública Web Push. |
| `VAPID_PRIVATE_KEY` | sim, para navegador e Android | Chave privada. Não commitar. |
| `VAPID_SUBJECT` | não | Padrão `mailto:aplicativopoliweb@gmail.com`. |
| `EXPO_ACCESS_TOKEN` | não | Access token da Expo, se a conta exigir. |
| `PUBLIC_SITE_URL` | não | Vira `data.url` junto com `data.path`. Padrão `https://www.poliwebapp.com.br`. O app iOS abre os dois. |
| `PUSH_MAX_DEVICES` | não | Teto de um disparo. Padrão `20000`. |
| `PUSH_DB` | não | `memory` sobe sem Postgres, só para ensaio. Os dados somem ao encerrar. |

No build do site (Cloudflare Pages):

| Variável | Função |
| --- | --- |
| `PUSH_API_URL` | Vazio usa a mesma `API_URL`. Preencha só se `/push` não estiver nesse host. |
| `VAPID_PUBLIC_KEY` | Opcional. Se vazio, o site busca `GET /push/vapid-public-key`. |

Gere o par VAPID:

```bash
npm run vapid --prefix api
```

## Subir

```bash
npm install --prefix api
npm run migrate --prefix api
npm start --prefix api
```

O processo aplica a migração ao iniciar. `npm run migrate` também serve para rodar o SQL à parte.

Nginx no host de `apiv4` (não substitui o `location /` da API):

```nginx
location /push {
  proxy_pass http://127.0.0.1:5055;
  proxy_set_header Host $host;
  proxy_set_header Authorization $http_authorization;
  proxy_set_header Content-Type $http_content_type;
}
```

## O que é gravado

`push_devices`: `token`, `token_type` (`expo`, `apns`, `webpush`), `platform` (`ios`, `android`, `web`), `user_id`, `city_id`, `city_name`, `role` (`user` visitante, `owner` dono de comércio), `categories`, `created_at`, `last_seen_at`, `invalidated_at`.

O registro faz upsert por `(token_type, token)`. No Web Push o `token` é o `endpoint` e as chaves ficam em `subscription`. Mandar o mesmo token de novo atualiza cidade, papel e `last_seen_at`, e reativa um token invalidado.

Visitante sem JWT válido grava cidade e categorias de interesse, com `user_id` nulo e papel `user`. Com `JWT_SECRET` igual ao da API, a conta logada grava o id do token (o id enviado pelo browser é ignorado). Dono é quem tem `company` ou `categoryAdId` no `context` do login.

O token APNs fica guardado. O disparo usa o token Expo (a Expo entrega no APNs) e o Web Push. Os dois não são enviados juntos para o mesmo aviso nativo.

`DeviceNotRegistered` no ticket ou no recibo da Expo, e HTTP 404/410 no Web Push, preenchem `invalidated_at`. Esse aparelho sai da contagem e dos próximos envios.

`push_campaigns` guarda título, texto, caminho, filtros, contagens e status.

## Rotas

- `POST /push/devices` — registro. Auth opcional.
- `GET /push/vapid-public-key` — chave pública.
- `POST /push/notifications/estimate` — admin. Resposta `{ count, byType: { expo, webpush } }`.
- `POST /push/notifications` — admin. Corpo: `title`, `body`, `path`, e `all` ou `cities`, `role` (`user`/`owner`), `categories`, `userId`.
- `GET /push/notifications` — histórico.

Admin é o JWT com papel admin, o `PUSH_ADMIN_SECRET`, ou um Bearer que a API principal aceite em `GET /customers`.

O painel fica em `/adm/notificacoes`, no mesmo login de `/adm`.

## Teste ponta a ponta

Automatizado, sem rede e sem Postgres:

```bash
npm test
```

Ensaio local do painel:

```bash
cd api
npm install
PUSH_DB=memory npm start
```

Em outro terminal, com o site apontando para essa porta (`PUSH_API_URL=http://127.0.0.1:5055` no `.env` do Quasar) e um admin logado, abra `/adm/notificacoes`. A contagem aparece antes do envio.

Registro manual:

```bash
curl -s -X POST http://127.0.0.1:5055/push/devices \
  -H 'content-type: application/json' \
  -d '{
    "expoPushToken": "ExponentPushToken[cole-o-token]",
    "devicePushToken": "token-apns-em-hex",
    "platform": "ios",
    "permission": "granted",
    "cityId": "402",
    "cityName": "Guaxupé"
  }'
```

Disparo manual (troque o segredo):

```bash
curl -s -X POST http://127.0.0.1:5055/push/notifications/estimate \
  -H 'content-type: application/json' \
  -H 'authorization: Bearer SEU_PUSH_ADMIN_SECRET' \
  -d '{"cities":["402"],"role":"user"}'

curl -s -X POST http://127.0.0.1:5055/push/notifications \
  -H 'content-type: application/json' \
  -H 'authorization: Bearer SEU_PUSH_ADMIN_SECRET' \
  -d '{"title":"Poliweb","body":"Teste","path":"/buscar","cities":["402"]}'
```

No iPhone, o app Expo (PR do `mobile/`) pede permissão depois que o site abre e injeta o payload em `window.poliwebRegisterPushToken`, no evento `poliweb-native-push`, em `localStorage.poliweb_native_push` e em `window.__POLIWEB_NATIVE_PUSH__`. O site manda isso para `POST /push/devices` junto com a cidade selecionada. Toque na notificação: o app lê `data.path` ou `data.url`.

No Chrome (e na TWA da Play Store) o service worker pede permissão, assina com a chave VAPID e o clique abre o `path`. Web Push no `quasar dev` não assina: o modo de desenvolvimento desregistra o service worker. Use o build PWA (`pnpm run build`) servido em HTTPS, ou em `localhost`.

Para invalidar de propósito, apague o app ou revogue a permissão e dispare de novo. A Expo responde `DeviceNotRegistered` e a linha fica com `invalidated_at`.
