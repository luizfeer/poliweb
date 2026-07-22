import AsyncStorage from '@react-native-async-storage/async-storage';

import { env } from '@/lib/env';

import type { MediaRole, PickedAsset, UploadJob, UploadResult, UploadStatus } from './types';
import { finalizeUpload, requestUploadToken, uploadToProcessor } from './upload';

const STORAGE_KEY = '@carmo/uploads/queue/v1';
const CONCURRENCY = 2;
const MAX_ATTEMPTS = 3;

type Listener = (jobs: UploadJob[]) => void;
type CompletionListener = (job: UploadJob) => void;

type AddJobInput = {
  citySlug?: string;
  entityType: string;
  entityId: string;
  role: MediaRole;
  label?: string | null;
  asset: PickedAsset;
};

let jobs: UploadJob[] = [];
let hydrated = false;
const listeners = new Set<Listener>();
const doneListeners = new Set<CompletionListener>();
const aborters = new Map<string, AbortController>();
let activeCount = 0;
let hydratePromise: Promise<void> | null = null;

function snapshot(): UploadJob[] {
  return jobs.map((j) => ({ ...j }));
}

function notify(): void {
  const snap = snapshot();
  for (const l of listeners) {
    try {
      l(snap);
    } catch {
      // noop
    }
  }
}

function notifyDone(job: UploadJob): void {
  for (const l of doneListeners) {
    try {
      l({ ...job });
    } catch {
      // noop
    }
  }
}

async function persist(): Promise<void> {
  try {
    // Não persiste jobs concluídos pra fila não crescer eternamente.
    const toSave = jobs.filter((j) => j.status !== 'done' && j.status !== 'cancelled');
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    // noop
  }
}

async function hydrate(): Promise<void> {
  if (hydrated) return;
  if (hydratePromise) return hydratePromise;
  hydratePromise = (async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as UploadJob[];
        // Jobs que estavam "uploading"/"processing" voltam pra pending pra retomar do zero.
        jobs = parsed.map((j) =>
          j.status === 'uploading' || j.status === 'processing'
            ? { ...j, status: 'pending', progress: 0 }
            : j,
        );
      }
    } catch {
      jobs = [];
    } finally {
      hydrated = true;
      hydratePromise = null;
      notify();
      pump();
    }
  })();
  return hydratePromise;
}

function updateJob(id: string, patch: Partial<UploadJob>): UploadJob | null {
  const idx = jobs.findIndex((j) => j.id === id);
  if (idx < 0) return null;
  const next: UploadJob = { ...jobs[idx]!, ...patch, updatedAt: Date.now() };
  jobs[idx] = next;
  notify();
  void persist();
  return next;
}

function newId(): string {
  return `u_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function pump(): void {
  if (!hydrated) return;
  while (activeCount < CONCURRENCY) {
    const next = jobs.find((j) => j.status === 'pending');
    if (!next) return;
    activeCount += 1;
    void runJob(next.id).finally(() => {
      activeCount -= 1;
      pump();
    });
  }
}

async function runJob(id: string): Promise<void> {
  const job = jobs.find((j) => j.id === id);
  if (!job) return;
  if (job.status !== 'pending') return;

  const aborter = new AbortController();
  aborters.set(id, aborter);

  updateJob(id, { status: 'uploading', progress: 0, error: null, attempts: job.attempts + 1 });

  try {
    const token = await requestUploadToken({
      citySlug: job.citySlug,
      entityType: job.entityType,
      entityId: job.entityId,
      role: job.role,
    });

    const processed = await uploadToProcessor({
      asset: job.asset,
      token,
      onProgress: (pct) => {
        // 0..90% durante o upload; processing toma 90..99.
        const mapped = Math.min(90, Math.max(0, Math.round(pct * 0.9)));
        updateJob(id, { progress: mapped / 100 });
      },
      signal: aborter.signal,
    });

    updateJob(id, { status: 'processing', progress: 0.92 });

    const result = await finalizeUpload({
      citySlug: job.citySlug,
      entityType: job.entityType,
      entityId: job.entityId,
      role: job.role,
      processed,
    });

    const final = updateJob(id, {
      status: 'done',
      progress: 1,
      result,
    });
    if (final) notifyDone(final);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const isAbort = message.includes('cancelado');
    if (isAbort) {
      updateJob(id, { status: 'cancelled', error: null });
    } else if (job.attempts + 1 < MAX_ATTEMPTS) {
      // Retry exponencial — devolve pra pending depois de um delay.
      const delay = Math.min(16_000, 1000 * 4 ** job.attempts);
      updateJob(id, { status: 'pending', progress: 0, error: message });
      setTimeout(() => pump(), delay);
    } else {
      updateJob(id, { status: 'failed', error: message });
    }
  } finally {
    aborters.delete(id);
  }
}

export const UploadQueue = {
  async init(): Promise<void> {
    await hydrate();
  },

  async addJob(input: AddJobInput): Promise<string> {
    await hydrate();
    const now = Date.now();
    const job: UploadJob = {
      id: newId(),
      citySlug: input.citySlug ?? env.defaultCitySlug,
      entityType: input.entityType,
      entityId: input.entityId,
      role: input.role,
      label: input.label ?? null,
      asset: input.asset,
      status: 'pending',
      progress: 0,
      attempts: 0,
      error: null,
      result: null,
      createdAt: now,
      updatedAt: now,
    };
    jobs = [...jobs, job];
    notify();
    void persist();
    pump();
    return job.id;
  },

  cancel(id: string): void {
    const aborter = aborters.get(id);
    if (aborter) aborter.abort();
    const job = jobs.find((j) => j.id === id);
    if (!job) return;
    if (job.status === 'pending' || job.status === 'failed') {
      updateJob(id, { status: 'cancelled' });
    }
  },

  retry(id: string): void {
    const job = jobs.find((j) => j.id === id);
    if (!job) return;
    if (job.status !== 'failed' && job.status !== 'cancelled') return;
    updateJob(id, { status: 'pending', progress: 0, error: null, attempts: 0 });
    pump();
  },

  clearDone(): void {
    jobs = jobs.filter((j) => j.status !== 'done' && j.status !== 'cancelled');
    notify();
    void persist();
  },

  getJobs(): UploadJob[] {
    return snapshot();
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    // Inicial: dispara estado atual após hydrate.
    void hydrate().then(() => listener(snapshot()));
    return () => listeners.delete(listener);
  },

  onComplete(listener: CompletionListener): () => void {
    doneListeners.add(listener);
    return () => doneListeners.delete(listener);
  },

  resultByJobId(id: string): UploadResult | null {
    const job = jobs.find((j) => j.id === id);
    return job?.result ?? null;
  },

  pendingByStatus(...statuses: UploadStatus[]): UploadJob[] {
    return snapshot().filter((j) => statuses.includes(j.status));
  },
};
