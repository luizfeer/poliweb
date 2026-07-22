/**
 * PM2 ecosystem para o worker do Portal Carmelitano.
 *
 * Uso:
 *   pm2 start apps/worker/deploy/pm2/ecosystem.config.cjs
 *   pm2 save && pm2 startup
 *
 * Cada cron usa `autorestart: false` + `cron_restart`. Daemon usa `autorestart: true`.
 * Logs ficam em ~/.pm2/logs. Para logs estruturados, troque `log_format: 'json'`.
 */

const SCRIPT = 'dist/index.js';
const CWD = '/opt/hail-mary/apps/worker';
// Carregue o .env via "node --env-file" se preferir, mas com PM2 é mais limpo
// referenciar o arquivo no env_file abaixo (PM2 v5+).
const env_file = `${CWD}/.env`;

const defaults = {
  cwd: CWD,
  script: SCRIPT,
  exec_mode: 'fork',
  instances: 1,
  env_file,
  log_date_format: 'YYYY-MM-DD HH:mm:ss',
};

module.exports = {
  apps: [
    // --------- DAEMONS (rodam sempre) ---------
    {
      ...defaults,
      name: 'worker-email-dispatch-bridge',
      args: 'email:dispatch-bridge',
      autorestart: true,
      restart_delay: 5000,
      max_restarts: 50,
    },

    // --------- CRONS (PM2 mata e religa no horário) ---------
    // Nudges de trial + despublicação por inadimplência — 1x por dia às 11:00 UTC (08:00 BRT)
    {
      ...defaults,
      name: 'worker-business-trial-nudges',
      args: 'business:trial-nudges',
      autorestart: false,
      cron_restart: '0 11 * * *',
    },

    // Scrapers diários (mantidos como referência; ajustar se já tiver systemd timer rodando)
    {
      ...defaults,
      name: 'worker-scrape-diario',
      args: 'scrape:diario',
      autorestart: false,
      cron_restart: '0 9 * * *',
    },
    {
      ...defaults,
      name: 'worker-scrape-licitacoes',
      args: 'scrape:licitacoes',
      autorestart: false,
      cron_restart: '30 9 * * *',
    },
    {
      ...defaults,
      name: 'worker-scrape-atas',
      args: 'scrape:atas',
      autorestart: false,
      cron_restart: '0 10 * * 1',
    },

    // Operacionais
    {
      ...defaults,
      name: 'worker-weather-update',
      args: 'weather:update',
      autorestart: false,
      cron_restart: '0 */3 * * *',
    },
    {
      ...defaults,
      name: 'worker-summarize-pending',
      args: 'summarize:pending',
      autorestart: false,
      cron_restart: '*/15 * * * *',
    },
    {
      ...defaults,
      name: 'worker-embed-pending',
      args: 'embed:pending',
      autorestart: false,
      cron_restart: '*/20 * * * *',
    },
    {
      ...defaults,
      name: 'worker-og-pending',
      args: 'og:pending',
      autorestart: false,
      cron_restart: '*/10 * * * *',
    },
    {
      ...defaults,
      name: 'worker-moderate-backlog',
      args: 'moderate:backlog',
      autorestart: false,
      cron_restart: '*/30 * * * *',
    },
    {
      ...defaults,
      name: 'worker-analytics-aggregate',
      args: 'analytics:aggregate',
      autorestart: false,
      cron_restart: '15 4 * * *',
    },
  ],
};
