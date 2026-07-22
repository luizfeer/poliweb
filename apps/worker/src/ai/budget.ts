import type { WorkerEnv } from "../runtime/env.js"

export function assertWithinBudget(_cityId: string, env: WorkerEnv): void {
  // Primeiro corte de segurança. O cálculo real por mês deve consultar ai_jobs.
  if (env.aiMonthlyBudgetUsd <= 0) {
    throw new Error("AI budget disabled for this worker")
  }
}
