export type FetchTextOptions = {
  timeoutMs: number
  maxRetries: number
  headers?: Record<string, string>
}

export async function fetchText(url: string, options: FetchTextOptions): Promise<string> {
  const response = await fetchWithRetry(url, options)
  return response.text()
}

export async function fetchJson<T>(url: string, options: FetchTextOptions & { body?: unknown; method?: string }): Promise<T> {
  const retryOptions: FetchTextOptions & { method?: string; body?: string } = {
    timeoutMs: options.timeoutMs,
    maxRetries: options.maxRetries,
    method: options.method ?? "GET",
    headers: {
      "content-type": "application/json",
      ...(options.headers ?? {}),
    },
  }
  if (options.body !== undefined) {
    retryOptions.body = JSON.stringify(options.body)
  }
  const response = await fetchWithRetry(url, retryOptions)

  return (await response.json()) as T
}

async function fetchWithRetry(
  url: string,
  options: FetchTextOptions & { method?: string; body?: string },
): Promise<Response> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= options.maxRetries; attempt += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs)

    try {
      const requestInit: RequestInit = {
        method: options.method ?? "GET",
        headers: {
          "user-agent": "CarmoLocalTransparencyWorker/0.1 (+https://carmodorioclaro.local)",
          accept: "text/html,application/json;q=0.9,*/*;q=0.8",
          ...(options.headers ?? {}),
        },
        signal: controller.signal,
      }
      if (options.body !== undefined) {
        requestInit.body = options.body
      }

      const response = await fetch(url, requestInit)

      if (response.ok) {
        return response
      }

      lastError = new Error(`HTTP ${response.status} for ${url}`)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
    } finally {
      clearTimeout(timeout)
    }

    if (attempt < options.maxRetries) {
      await sleep(backoffMs(attempt))
    }
  }

  throw lastError ?? new Error(`Fetch failed for ${url}`)
}

function backoffMs(attempt: number): number {
  return 500 * 2 ** attempt
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
