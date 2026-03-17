# Poliweb (App)

Poliweb é um projeto freelancer ainda sendo realizado para um empresa de listagem de serviços e empresas. Desenvolvido em Quasar(Vue 3), o produto tem o deploy na Cloudflare Pages, e o app mobile disponibilizado em PWA e TWA na PlayStore
Sua funnção é consumir a API criada em node e hospedado no AWS Lightsail, mostrando listagem e paginas dos serviços anunciados.

`Deploy:`
  - https://www.poliwebapp.com.br/
  - https://play.google.com/store/apps/details?id=br.com.poliwebapp.www.twa

### Cloudflare Pages (build)
- **Build command:** `pnpm run build`
- **Build output directory:** `dist/pwa` (ou o que estiver em quasar.conf.js)

## Install the dependencies
```bash
yarn
```

### Start the app in development mode (hot-code reloading, error reporting, etc.)
```bash
quasar dev
```

### Lint the files
```bash
yarn run lint
```

### Build the app for production
```bash
quasar build
```

### Build SSR para `/comercio`
```bash
pnpm run build:ssr
pnpm run start:ssr
```

Variaveis relevantes para o deploy SSR:

- `API_URL_SERVER=http://127.0.0.1:5001`
- `API_URL_BROWSER=https://apiv3.poliwebapp.com.br`
- `SEO_SITE_URL=https://ssr.poliwebapp.com.br`
- `SSR_ONLY_ROUTE_PREFIX=/comercio`
- `SSR_FALLBACK_URL=https://www.poliwebapp.com.br`

Exemplo com PM2:
```bash
pnpm run build:ssr
pm2 start ecosystem.config.js
```

### Customize the configuration
See [Configuring quasar.conf.js](https://v2.quasar.dev/quasar-cli/quasar-conf-js).
