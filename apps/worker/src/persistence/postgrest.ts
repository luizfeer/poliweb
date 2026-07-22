import type { AiJob, City, JsonValue } from "../types.js"

type PostgrestOptions = {
  supabaseUrl: string
  serviceRoleKey: string
}

type QueryValue = string | number | boolean

export class PostgrestClient {
  private readonly baseUrl: string
  private readonly headers: Record<string, string>

  constructor(options: PostgrestOptions) {
    this.baseUrl = `${options.supabaseUrl.replace(/\/$/, "")}/rest/v1`
    this.headers = {
      apikey: options.serviceRoleKey,
      authorization: `Bearer ${options.serviceRoleKey}`,
      "content-type": "application/json",
      "user-agent": "Node.js",
      "x-client-info": "hail-mary-worker",
    }
  }

  async findCityBySlug(slug: string): Promise<City> {
    const rows = await this.selectRows<City>("cities", { slug }, "id,slug,name")
    const city = rows[0]
    if (!city) {
      throw new Error(`City not found for slug ${slug}`)
    }
    return city
  }

  async createAiJob(input: {
    cityId: string | null
    jobType: string
    inputRef: JsonValue
    model?: string | null
  }): Promise<AiJob> {
    const rows = await this.insertRows<AiJob>("ai_jobs", [
      {
        city_id: input.cityId,
        job_type: input.jobType,
        status: "running",
        input_ref: input.inputRef,
        model: input.model ?? null,
        started_at: new Date().toISOString(),
      },
    ])
    const job = rows[0]
    if (!job) {
      throw new Error("Failed to create ai_job")
    }
    return job
  }

  async finishAiJob(
    jobId: string,
    input: {
      status: "completed" | "failed"
      outputRef: JsonValue
      error?: string | null
      tokensInput?: number | null
      tokensOutput?: number | null
      costUsd?: number | null
    },
  ): Promise<void> {
    await this.updateRows(
      "ai_jobs",
      { id: jobId },
      {
        status: input.status,
        output_ref: input.outputRef,
        error: input.error ?? null,
        tokens_input: input.tokensInput ?? null,
        tokens_output: input.tokensOutput ?? null,
        cost_usd: input.costUsd ?? null,
        finished_at: new Date().toISOString(),
      },
    )
  }

  async selectRows<T>(table: string, filters: Record<string, QueryValue>, select = "*"): Promise<T[]> {
    const url = this.url(table, filters, select)
    const response = await fetch(url, {
      headers: this.headers,
    })
    await assertOk(response, `select ${table}`)
    return (await response.json()) as T[]
  }

  async selectWithParams<T>(
    table: string,
    params: Record<string, string | number | boolean>,
  ): Promise<T[]> {
    const search = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      search.set(key, String(value))
    }

    const response = await fetch(`${this.baseUrl}/${table}?${search.toString()}`, {
      headers: this.headers,
    })
    await assertOk(response, `select ${table}`)
    return (await response.json()) as T[]
  }

  async insertRows<T>(table: string, rows: Array<Record<string, JsonValue | undefined>>): Promise<T[]> {
    const response = await fetch(`${this.baseUrl}/${table}`, {
      method: "POST",
      headers: {
        ...this.headers,
        prefer: "return=representation",
      },
      body: JSON.stringify(rows.map(stripUndefined)),
    })
    await assertOk(response, `insert ${table}`)
    return (await response.json()) as T[]
  }

  async updateRows<T>(
    table: string,
    filters: Record<string, QueryValue>,
    patch: Record<string, JsonValue | undefined>,
  ): Promise<T[]> {
    const response = await fetch(this.url(table, filters), {
      method: "PATCH",
      headers: {
        ...this.headers,
        prefer: "return=representation",
      },
      body: JSON.stringify(stripUndefined(patch)),
    })
    await assertOk(response, `update ${table}`)
    return (await response.json()) as T[]
  }

  async upsertRows<T>(
    table: string,
    rows: Array<Record<string, JsonValue | undefined>>,
    onConflict: string,
  ): Promise<T[]> {
    const response = await fetch(`${this.baseUrl}/${table}?on_conflict=${encodeURIComponent(onConflict)}`, {
      method: "POST",
      headers: {
        ...this.headers,
        prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify(rows.map(stripUndefined)),
    })
    await assertOk(response, `upsert ${table}`)
    return (await response.json()) as T[]
  }

  async deleteRows(table: string, filters: Record<string, QueryValue>): Promise<void> {
    const response = await fetch(this.url(table, filters), {
      method: "DELETE",
      headers: this.headers,
    })
    await assertOk(response, `delete ${table}`)
  }

  private url(table: string, filters: Record<string, QueryValue>, select = "*"): string {
    const params = new URLSearchParams({ select })
    for (const [key, value] of Object.entries(filters)) {
      if (typeof value === "string" && /^(eq|neq|gt|gte|lt|lte|is|in|like|ilike)\./.test(value)) {
        params.set(key, value)
      } else {
        params.set(key, `eq.${value}`)
      }
    }
    return `${this.baseUrl}/${table}?${params.toString()}`
  }
}

async function assertOk(response: Response, operation: string): Promise<void> {
  if (response.ok) {
    return
  }
  const body = await response.text()
  throw new Error(`${operation} failed: HTTP ${response.status} ${body}`)
}

function stripUndefined(input: Record<string, JsonValue | undefined>): Record<string, JsonValue> {
  const output: Record<string, JsonValue> = {}
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) {
      output[key] = value
    }
  }
  return output
}
