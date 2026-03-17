# Guia SSR para `/comercio/*` (SEO) com Cloudflare Pages + Worker + VPS

Este guia descreve a arquitetura e os passos para:

- manter o **PWA (SPA)** no **Cloudflare Pages**
- renderizar **SSR apenas para** `https://www.poliwebapp.com.br/comercio/:id/:slug`
- usar um **Cloudflare Worker** para rotear `/comercio/*` para uma **VPS (Quasar SSR)**
- aplicar **cache no edge** e ter **modo de falha** (fallback para o PWA) para evitar tela 522

---

## Visão geral (arquitetura)

- **Cloudflare Pages** (estático): atende **todas** as rotas do PWA (`/*`)
- **Cloudflare Worker** (roteamento + cache): atende **somente** `*/comercio/*`
- **VPS** (Node/SSR): atende **somente** as páginas SSR de comércio

Roteamento desejado no mesmo domínio:

- **`/comercio/*` → VPS (SSR)**
- **`/*` → Cloudflare Pages (PWA)**

---

## O que foi implementado no front

### Rota SEO SSR

- Rota nova: `src/router/routes.js`
  - `path: '/comercio/:id/:slug?'` → `pages/Commerce.vue`

### Página SSR: `src/pages/Commerce.vue`

- Busca dados do comércio via API (`/categories/ads/:id?nonDeleted=true`)
- Usa `onServerPrefetch()` para **aguardar dados no SSR**
  - Resultado: ao abrir direto `/comercio/...`, o HTML já vem “pronto” (sem skeleton)
- `useMeta()` com:
  - title/description/keywords
  - Open Graph + Twitter Card
  - canonical em `/comercio/...`
  - JSON-LD `LocalBusiness` (Rich Results)
- Widget no fim da página:
  - botão **Buscar comércios** (vai para `/buscar`)
  - botão **Copiar link** (copia canonical `/comercio/...`)

### SSR-safe no axios boot

Arquivo: `src/boot/axios.js`

- `localStorage` agora só é lido no browser (`typeof window !== 'undefined'`)
- Isso evita quebrar SSR (server não tem `window/localStorage`)

---

## Rodar SSR local (DEV)

Para testar SSR de verdade no dev:

```bash
npx quasar dev -m ssr -p 3050
```

Abra:

- `http://localhost:3050/comercio/5020/lupa-produtos-medicos`

Observação: `npm run dev` roda PWA (`-m pwa`). Para SSR, sempre use `-m ssr`.

---

## Build SSR (produção)

Gerar bundle SSR:

```bash
npx quasar build -m ssr
```

Validar localmente servindo o SSR:

```bash
npx quasar serve dist/ssr -p 3000
```

Em VPS, normalmente roda como serviço (PM2/systemd) e/ou por trás de Nginx.

---

## Worker: roteamento + cache + modo de falha

Pasta:

- `worker/wrangler.toml`
- `worker/src/index.js`

### Variáveis principais

No `worker/wrangler.toml`:

- **`SSR_ORIGIN`**: origin da VPS (recomendado ser **DNS only**), exemplo:
  - `https://ssr.poliwebapp.com.br`
- **`CACHE_TTL_SECONDS`**: TTL do cache HTML, exemplo:
  - `900` (15 min)

### O que o Worker faz

- Intercepta **somente** requests de navegação HTML para `/comercio/*`
  - ignora assets (`.css`, `.js`, imagens, fontes, `/assets/`, etc.) para não quebrar CSS/IMG
- Faz proxy para `SSR_ORIGIN`
- Cacheia **apenas**:
  - `GET`
  - resposta `200`
  - `Content-Type` HTML
- **Modo de falha**:
  - se a VPS falhar (timeout/erro), faz redirect `302`:
    - `/comercio/:id/:slug` → `/:id/:slug` (rota SPA no Pages)

### Rodar e publicar o Worker

Scripts no `package.json`:

```bash
npm run worker:dev
npm run worker:deploy
```

Nota: usa `npx wrangler ...` para não depender do `npm install` do app.

---

## Configurar a rota `/comercio/*` no Cloudflare (UI em PT)

### 1) DNS do origin da VPS (recomendado)

No Cloudflare → **DNS**:

- criar `ssr.poliwebapp.com.br` → IP da VPS
- marcar como **Somente DNS** (nuvem cinza)

### 2) Deploy do Worker

```bash
npx wrangler login
npm run worker:deploy
```

### 3) Associar rota no Cloudflare

Cloudflare → **Workers e Pages** → **Workers** → selecione o Worker → **Configurações** → **Gatilhos** → **Rotas**

Adicionar:

- `www.poliwebapp.com.br/comercio/*`

Se também usa sem `www`, adicionar:

- `poliwebapp.com.br/comercio/*`

---

## Troubleshooting

### Erro 522 (Connection timed out)

522 indica que o Cloudflare **não conseguiu alcançar a VPS**.

Checklist:

- `SSR_ORIGIN` aponta para host correto?
- DNS do origin está **Somente DNS**?
- VPS liberou porta **80/443** no firewall?
- Nginx/proxy está rodando e encaminhando para o Node SSR?
- SSR está ouvindo na porta esperada?

### CSS/IMG quebrando quando ativa `/comercio/*`

Isso acontece quando o Worker intercepta assets por engano.

O Worker atual já:

- ignora `/assets/` e extensões `.css/.js/.png/...`
- só intercepta navegação HTML (Accept contém `text/html`)

Se ainda quebrar, confira:

- se o Quasar SSR está gerando assets com caminho absoluto (`/assets/...`)
- se não existe asset servido por path dentro de `/comercio/...`

---

## Recomendação de SEO

- Sitemap deve listar URLs **canônicas**:
  - `https://www.poliwebapp.com.br/comercio/:id/:slug`
- Em caso de falha do SSR, o fallback para SPA ainda funciona para usuário,
  mas o ideal é manter SSR estável para o Google indexar.

## Sitemap

- A geração de sitemap foi movida para o backend `poliwebapp-api`
- O motivo é evitar cascata de requests no SSR e gerar o XML direto do PostgreSQL
- A documentação operacional do sitemap ficou no backend:
  - `poliwebapp-api/README-SITEMAP.md`
