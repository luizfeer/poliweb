import assert from "node:assert/strict";
import { test } from "node:test";
import { nextRecoveryAttempt } from "./webViewRecovery.ts";

test("recovers once after a process termination and stops repeated crashes", () => {
  const first = nextRecoveryAttempt({ startedAt: 0, attempts: 0 }, 10);
  assert.deepEqual(first, { startedAt: 10, attempts: 1 });
  const second = nextRecoveryAttempt(first!, 1000);
  assert.deepEqual(second, { startedAt: 10, attempts: 2 });
  assert.equal(nextRecoveryAttempt(second!, 2000), null);
});

test("allows recovery again after a minute without a crash", () => {
  assert.deepEqual(
    nextRecoveryAttempt({ startedAt: 10, attempts: 2 }, 60_010),
    { startedAt: 60_010, attempts: 1 },
  );
});
