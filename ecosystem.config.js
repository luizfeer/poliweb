module.exports = {
  apps: [
    {
      name: 'poliweb_ssr_comercio',
      script: 'index.js',
      cwd: `${__dirname}/dist/ssr`,
      interpreter: '/root/.nvm/versions/node/v24.13.1/bin/node',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        HOST: '127.0.0.1',
        PORT: 3100,
        API_URL: 'https://apiv4.poliwebapp.com.br',
        API_URL_BROWSER: 'https://apiv4.poliwebapp.com.br',
        API_URL_SERVER: 'http://127.0.0.1:5000',
        API_URL_LOCAL: 'http://127.0.0.1:5000',
        PUBLIC_SITE_URL: 'https://www.poliwebapp.com.br',
        SEO_SITE_URL: 'https://www.poliwebapp.com.br',
        SSR_ONLY_ROUTE_PREFIX: '/comercio,/adm,/painel',
        SSR_FALLBACK_URL: 'https://www.poliwebapp.com.br'
      }
    }
  ]
}
