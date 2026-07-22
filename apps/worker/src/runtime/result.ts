import type { JobCounters, JobResult } from "../types.js"

export function createCounters(): JobCounters {
  return {
    processed: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  }
}

export function toJobResult(counters: JobCounters): JobResult {
  return {
    ...counters,
    ok: counters.errors.length === 0,
  }
}
