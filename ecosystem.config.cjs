'use strict';

const REPO = __dirname;
const WORKER = `${REPO}/apps/worker`;
const MEDIA = `${REPO}/apps/media-processor`;
const AGENT = `${REPO}/apps/agent`;

module.exports = {
  apps: [
    // ─── City Agent (daemon permanente — porta 8787) ───────────────
    {
      name: 'city-agent',
      script: 'dist/index.js',
      cwd: AGENT,
      interpreter: 'node',
      interpreter_args: '--env-file=.env',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      restart_delay: 3000,
      max_restarts: 10,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: `${REPO}/.pm2-logs/agent-error.log`,
      out_file: `${REPO}/.pm2-logs/agent-out.log`,
    },

    // ─── Media Processor (daemon permanente) ───────────────────────
    {
      name: 'hail-mary-media',
      script: 'dist/index.js',
      cwd: MEDIA,
      interpreter: 'node',
      interpreter_args: '--env-file=.env',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      restart_delay: 3000,
      max_restarts: 10,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: `${REPO}/.pm2-logs/media-error.log`,
      out_file: `${REPO}/.pm2-logs/media-out.log`,
    },

    // ─── Worker: scrape Diário Oficial (seg/qui 06h) ──────────────
    {
      name: 'worker-scrape-diario',
      script: 'dist/index.js',
      args: 'scrape:diario',
      cwd: WORKER,
      interpreter: 'node',
      interpreter_args: '--env-file=.env',
      autorestart: false,
      cron_restart: '0 6 * * 1,4',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: `${REPO}/.pm2-logs/worker-diario-error.log`,
      out_file: `${REPO}/.pm2-logs/worker-diario-out.log`,
    },

    // ─── Worker: scrape Licitações (seg/qui 06h30) ─────────────────
    {
      name: 'worker-scrape-licitacoes',
      script: 'dist/index.js',
      args: 'scrape:licitacoes',
      cwd: WORKER,
      interpreter: 'node',
      interpreter_args: '--env-file=.env',
      autorestart: false,
      cron_restart: '30 6 * * 1,4',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: `${REPO}/.pm2-logs/worker-licitacoes-error.log`,
      out_file: `${REPO}/.pm2-logs/worker-licitacoes-out.log`,
    },

    // ─── Worker: scrape Atas Câmara (segunda 07h) ──────────────────
    {
      name: 'worker-scrape-atas',
      script: 'dist/index.js',
      args: 'scrape:atas',
      cwd: WORKER,
      interpreter: 'node',
      interpreter_args: '--env-file=.env',
      autorestart: false,
      cron_restart: '0 7 * * 1',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: `${REPO}/.pm2-logs/worker-atas-error.log`,
      out_file: `${REPO}/.pm2-logs/worker-atas-out.log`,
    },

    // ─── Worker: previsão do tempo (a cada 3h) ─────────────────────
    {
      name: 'worker-weather',
      script: 'dist/index.js',
      args: 'weather:update',
      cwd: WORKER,
      interpreter: 'node',
      interpreter_args: '--env-file=.env',
      autorestart: false,
      cron_restart: '0 */3 * * *',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: `${REPO}/.pm2-logs/worker-weather-error.log`,
      out_file: `${REPO}/.pm2-logs/worker-weather-out.log`,
    },

    {
      name: 'worker-road-routes',
      script: 'dist/index.js',
      args: 'road-routes:update',
      cwd: WORKER,
      interpreter: 'node',
      interpreter_args: '--env-file=.env',
      autorestart: false,
      cron_restart: '0 * * * *',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: `${REPO}/.pm2-logs/worker-road-routes-error.log`,
      out_file: `${REPO}/.pm2-logs/worker-road-routes-out.log`,
    },

    // ─── Worker: notícias Câmara (terça 07h) ──────────────────────
    {
      name: 'worker-scrape-noticias-camara',
      script: 'dist/index.js',
      args: 'scrape:noticias-camara',
      cwd: WORKER,
      interpreter: 'node',
      interpreter_args: '--env-file=.env',
      autorestart: false,
      cron_restart: '0 7 * * 2',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: `${REPO}/.pm2-logs/worker-noticias-camara-error.log`,
      out_file: `${REPO}/.pm2-logs/worker-noticias-camara-out.log`,
    },

    // ─── Worker: notícias Prefeitura (terça 07h15) ─────────────────
    {
      name: 'worker-scrape-noticias-prefeitura',
      script: 'dist/index.js',
      args: 'scrape:noticias-prefeitura',
      cwd: WORKER,
      interpreter: 'node',
      interpreter_args: '--env-file=.env',
      autorestart: false,
      cron_restart: '15 7 * * 2',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: `${REPO}/.pm2-logs/worker-noticias-prefeitura-error.log`,
      out_file: `${REPO}/.pm2-logs/worker-noticias-prefeitura-out.log`,
    },

    // ─── Worker: proposições Câmara (terça 07h30) ──────────────────
    {
      name: 'worker-scrape-proposicoes',
      script: 'dist/index.js',
      args: 'scrape:proposicoes',
      cwd: WORKER,
      interpreter: 'node',
      interpreter_args: '--env-file=.env',
      autorestart: false,
      cron_restart: '30 7 * * 2',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: `${REPO}/.pm2-logs/worker-proposicoes-error.log`,
      out_file: `${REPO}/.pm2-logs/worker-proposicoes-out.log`,
    },

    // ─── Worker: sumarizar pendentes (seg/qui 08h) ─────────────────
    {
      name: 'worker-summarize',
      script: 'dist/index.js',
      args: 'summarize:pending',
      cwd: WORKER,
      interpreter: 'node',
      interpreter_args: '--env-file=.env',
      autorestart: false,
      cron_restart: '0 8 * * 1,4',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: `${REPO}/.pm2-logs/worker-summarize-error.log`,
      out_file: `${REPO}/.pm2-logs/worker-summarize-out.log`,
    },

    // ─── Worker: embeddings pendentes (diário 08h30) ───────────────
    {
      name: 'worker-embed',
      script: 'dist/index.js',
      args: 'embed:pending',
      cwd: WORKER,
      interpreter: 'node',
      interpreter_args: '--env-file=.env',
      autorestart: false,
      cron_restart: '30 8 * * *',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: `${REPO}/.pm2-logs/worker-embed-error.log`,
      out_file: `${REPO}/.pm2-logs/worker-embed-out.log`,
    },

    // ─── Worker: reindexar turismo (diário 03h) ───────────────────
    {
      name: 'worker-reindex-tourism',
      script: 'dist/index.js',
      args: 'reindex:tourism',
      cwd: WORKER,
      interpreter: 'node',
      interpreter_args: '--env-file=.env',
      autorestart: false,
      cron_restart: '0 3 * * *',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: `${REPO}/.pm2-logs/worker-reindex-tourism-error.log`,
      out_file: `${REPO}/.pm2-logs/worker-reindex-tourism-out.log`,
    },

    // ─── Worker: analytics de negócios (diário 03h30) ─────────────
    {
      name: 'worker-analytics',
      script: 'dist/index.js',
      args: 'analytics:aggregate',
      cwd: WORKER,
      interpreter: 'node',
      interpreter_args: '--env-file=.env',
      autorestart: false,
      cron_restart: '30 3 * * *',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: `${REPO}/.pm2-logs/worker-analytics-error.log`,
      out_file: `${REPO}/.pm2-logs/worker-analytics-out.log`,
    },

    // ─── Worker: indexação semântica (diário 04h) ──────────────────
    {
      name: 'worker-indexing',
      script: 'dist/index.js',
      args: 'indexing:semantic',
      cwd: WORKER,
      interpreter: 'node',
      interpreter_args: '--env-file=.env',
      autorestart: false,
      cron_restart: '0 4 * * *',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: `${REPO}/.pm2-logs/worker-indexing-error.log`,
      out_file: `${REPO}/.pm2-logs/worker-indexing-out.log`,
    },

    // ─── Worker: moderação de backlog (diário 09h) ─────────────────
    {
      name: 'worker-moderate',
      script: 'dist/index.js',
      args: 'moderate:backlog',
      cwd: WORKER,
      interpreter: 'node',
      interpreter_args: '--env-file=.env',
      autorestart: false,
      cron_restart: '0 9 * * *',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: `${REPO}/.pm2-logs/worker-moderate-error.log`,
      out_file: `${REPO}/.pm2-logs/worker-moderate-out.log`,
    },

    // ─── Worker: importar fotos Google Business (a cada 20min) ────
    {
      name: 'worker-google-photos',
      script: 'dist/index.js',
      args: 'import:google-business-photos',
      cwd: WORKER,
      interpreter: 'node',
      interpreter_args: '--env-file=.env',
      autorestart: false,
      cron_restart: '*/20 * * * *',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: `${REPO}/.pm2-logs/worker-google-photos-error.log`,
      out_file: `${REPO}/.pm2-logs/worker-google-photos-out.log`,
    },

    // ─── Worker: gerar OG images pendentes (a cada 3 min) ─────────
    {
      name: 'worker-og-image',
      script: 'dist/index.js',
      args: 'og:pending',
      cwd: WORKER,
      interpreter: 'node',
      interpreter_args: '--env-file=.env',
      autorestart: false,
      cron_restart: '*/3 * * * *',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: `${REPO}/.pm2-logs/worker-og-image-error.log`,
      out_file: `${REPO}/.pm2-logs/worker-og-image-out.log`,
    },

    // ─── Worker: envio de push (daemon permanente, fila Supabase) ─
    {
      name: 'worker-push-deliveries',
      script: 'dist/index.js',
      args: 'push:deliveries',
      cwd: WORKER,
      interpreter: 'node',
      interpreter_args: '--env-file=.env',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      restart_delay: 5000,
      max_restarts: 10,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: `${REPO}/.pm2-logs/worker-push-error.log`,
      out_file: `${REPO}/.pm2-logs/worker-push-out.log`,
    },

    // ─── Worker: envio de emails (daemon permanente, fila Supabase) ─
    {
      name: 'worker-email-deliveries',
      script: 'dist/index.js',
      args: 'email:deliveries',
      cwd: WORKER,
      interpreter: 'node',
      interpreter_args: '--env-file=.env',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      restart_delay: 5000,
      max_restarts: 10,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: `${REPO}/.pm2-logs/worker-email-error.log`,
      out_file: `${REPO}/.pm2-logs/worker-email-out.log`,
    },

  ],
};
