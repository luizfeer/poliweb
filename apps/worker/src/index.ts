import type { JobName } from './types.js';
import { readArgv, readEnv } from './runtime/env.js';
import { logger } from './runtime/logger.js';
import { PostgrestClient } from './persistence/postgrest.js';
import { runScrapeJob } from './jobs/scrape.js';
import { runSummarizePending } from './jobs/summarize-pending.js';
import { runEmbedPending } from './jobs/embed-pending.js';
import { runModerateBacklog } from './jobs/moderate-backlog.js';
import { runCliqueiAcheiBusinessesImport } from './jobs/import-cliqueiachei-businesses.js';
import { runGoogleBusinessPhotoImport } from './jobs/import-google-business-photos.js';
import { runGoogleAttractionPhotoImport } from './jobs/import-google-attraction-photos.js';
import { runAiEstimate } from './jobs/estimate-ai.js';
import { runSemanticIndexing } from './indexing/index.js';
import { runWeatherUpdate } from './jobs/weather-update.js';
import { runRoadRoutesUpdate } from './jobs/road-routes-update.js';
import { runReindexTourism } from './jobs/reindex-tourism.js';
import { runAnalyticsAggregate } from './jobs/analytics-aggregate.js';
import { runOgPending } from './jobs/og-pending.js';
import { runEmailDispatchBridge } from './jobs/email-dispatch-bridge.js';
import { runPushDeliveries } from './jobs/push-deliveries.js';
import { runBusinessTrialNudges } from './jobs/business-trial-nudges.js';
import { runMediaSweepOrphans } from './jobs/media-sweep-orphans.js';

const JOBS: JobName[] = [
  'scrape:diario',
  'scrape:atas',
  'scrape:licitacoes',
  'scrape:noticias-camara',
  'scrape:noticias-prefeitura',
  'scrape:proposicoes',
  'scrape:all',
  'import:cliqueiachei-businesses',
  'import:google-business-photos',
  'import:google-attraction-photos',
  'estimate:ia',
  'summarize:pending',
  'embed:pending',
  'indexing:semantic',
  'moderate:backlog',
  'weather:update',
  'road-routes:update',
  'reindex:tourism',
  'analytics:aggregate',
  'og:pending',
  'email:dispatch-bridge',
  'push:deliveries',
  'business:trial-nudges',
  'media:sweep-orphans',
];

async function main(): Promise<void> {
  const [jobArg] = readArgv();
  const job = parseJob(jobArg);
  const env = readEnv();
  const startedAt = Date.now();
  const db = new PostgrestClient({
    supabaseUrl: env.supabaseUrl,
    serviceRoleKey: env.supabaseServiceRoleKey,
  });
  const runLog = await startWorkerRunLog(db, job, env.citySlug).catch((error: unknown) => {
    logger.error('worker run log start failed', { error: error instanceof Error ? error.message : String(error) });
    return null;
  });

  logger.info('worker started', { job, city_slug: env.citySlug });

  try {
    await runJob(job, env);
    if (runLog) {
      await finishWorkerRunLog(db, runLog.id, 'success', startedAt).catch((logError: unknown) => {
        logger.error('worker run log finish failed', {
          error: logError instanceof Error ? logError.message : String(logError),
        });
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (runLog) {
      await finishWorkerRunLog(db, runLog.id, 'error', startedAt, message).catch((logError: unknown) => {
        logger.error('worker run log finish failed', {
          error: logError instanceof Error ? logError.message : String(logError),
        });
      });
    }
    throw error;
  }
}

async function runJob(job: JobName, env: ReturnType<typeof readEnv>): Promise<void> {
  if (
    job === 'scrape:diario' ||
    job === 'scrape:atas' ||
    job === 'scrape:licitacoes' ||
    job === 'scrape:noticias-camara' ||
    job === 'scrape:noticias-prefeitura' ||
    job === 'scrape:proposicoes' ||
    job === 'scrape:all'
  ) {
    await runScrapeJob(job, env);
    return;
  }

  if (job === 'estimate:ia') {
    await runAiEstimate(env);
    return;
  }

  if (job === 'import:cliqueiachei-businesses') {
    await runCliqueiAcheiBusinessesImport(env, readArgv().slice(1));
    return;
  }

  if (job === 'import:google-business-photos') {
    await runGoogleBusinessPhotoImport(env, readArgv().slice(1));
    return;
  }

  if (job === 'import:google-attraction-photos') {
    await runGoogleAttractionPhotoImport(env, readArgv().slice(1));
    return;
  }

  if (job === 'summarize:pending') {
    await runSummarizePending(env);
    return;
  }

  if (job === 'embed:pending') {
    await runEmbedPending(env);
    return;
  }

  if (job === 'indexing:semantic') {
    await runSemanticIndexing(env);
    return;
  }

  if (job === 'weather:update') {
    await runWeatherUpdate(env);
    return;
  }

  if (job === 'road-routes:update') {
    await runRoadRoutesUpdate(env);
    return;
  }

  if (job === 'reindex:tourism') {
    await runReindexTourism(env);
    return;
  }

  if (job === 'analytics:aggregate') {
    await runAnalyticsAggregate(env);
    return;
  }

  if (job === 'og:pending') {
    await runOgPending(env);
    return;
  }

  if (job === 'email:dispatch-bridge') {
    await runEmailDispatchBridge(env);
    return;
  }

  if (job === 'push:deliveries') {
    await runPushDeliveries(env);
    return;
  }

  if (job === 'business:trial-nudges') {
    await runBusinessTrialNudges(env);
    return;
  }

  if (job === 'media:sweep-orphans') {
    await runMediaSweepOrphans(env);
    return;
  }

  await runModerateBacklog(env);
}

async function startWorkerRunLog(
  db: PostgrestClient,
  job: JobName,
  citySlug: string,
): Promise<{ id: string }> {
  const city = await db.findCityBySlug(citySlug).catch(() => null);
  const rows = await db.insertRows<{ id: string }>('worker_run_logs', [
    {
      job_name: job,
      status: 'running',
      city_id: city?.id ?? null,
      city_slug: citySlug,
      metadata: { argv: readArgv() },
    },
  ]);
  const row = rows[0];
  if (!row) throw new Error('Failed to create worker_run_logs row');
  return row;
}

async function finishWorkerRunLog(
  db: PostgrestClient,
  id: string,
  status: 'success' | 'error',
  startedAt: number,
  errorMessage?: string,
): Promise<void> {
  await db.updateRows('worker_run_logs', { id }, {
    status,
    finished_at: new Date().toISOString(),
    duration_ms: clampPostgresInteger(Date.now() - startedAt),
    error_message: errorMessage ?? null,
  });
}

function clampPostgresInteger(value: number): number {
  return Math.min(value, 2_147_483_647);
}

function parseJob(value: string | undefined): JobName {
  if (value && JOBS.includes(value as JobName)) {
    return value as JobName;
  }

  throw new Error(`Usage: node dist/index.js <${JOBS.join('|')}>`);
}

main().catch((error: unknown) => {
  logger.error('worker crashed', { error: error instanceof Error ? error.message : String(error) });
});
