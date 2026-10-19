export type RecoveryState = { startedAt: number; attempts: number };

// Two automatic attempts, then show the retry screen instead of a crash loop.
export function nextRecoveryAttempt(
  state: RecoveryState,
  now: number,
): RecoveryState | null {
  if (state.attempts === 0 || now - state.startedAt >= 60_000) {
    return { startedAt: now, attempts: 1 };
  }
  if (state.attempts >= 2) return null;
  return { ...state, attempts: state.attempts + 1 };
}
