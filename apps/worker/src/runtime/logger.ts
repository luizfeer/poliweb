import type { JsonValue } from "../types.js"

export type Logger = {
  info(message: string, meta?: Record<string, JsonValue>): void
  warn(message: string, meta?: Record<string, JsonValue>): void
  error(message: string, meta?: Record<string, JsonValue>): void
}

export const logger: Logger = {
  info(message, meta) {
    write("info", message, meta)
  },
  warn(message, meta) {
    write("warn", message, meta)
  },
  error(message, meta) {
    write("error", message, meta)
  },
}

function write(level: "info" | "warn" | "error", message: string, meta?: Record<string, JsonValue>): void {
  const payload = {
    at: new Date().toISOString(),
    level,
    message,
    ...(meta ? { meta } : {}),
  }
  const line = JSON.stringify(payload)
  if (level === "error") {
    console.error(line)
    return
  }
  console.log(line)
}
