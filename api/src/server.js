import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { buildApp } from './app.js'
import { readConfig } from './config.js'
import { createPgDb, createPgliteDb, createPgPool } from './db.js'
import { migrate } from './migrate.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

async function loadEnvFile() {
  try {
    const content = await readFile(path.join(root, '.env'), 'utf8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq < 1) continue
      const key = trimmed.slice(0, eq).trim()
      const value = trimmed.slice(eq + 1).trim()
      if (key && process.env[key] === undefined) process.env[key] = value
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
}

async function openDatabase(config) {
  if (config.memoryDb) {
    const { PGlite } = await import('@electric-sql/pglite')
    const db = createPgliteDb(new PGlite())
    await migrate(db)
    return db
  }

  if (!config.databaseUrl) {
    throw new Error('Defina DATABASE_URL ou use PUSH_DB=memory só para ensaio local.')
  }

  const pg = await import('pg')
  const client = new pg.default.Client({ connectionString: config.databaseUrl })
  await client.connect()
  try {
    await migrate(createPgDb(client))
  } finally {
    await client.end()
  }
  return createPgDb(createPgPool(config.databaseUrl))
}

export async function start() {
  await loadEnvFile()
  const config = readConfig()
  const db = await openDatabase(config)
  const app = await buildApp({ db, config, logger: true })
  await app.listen({ port: config.port, host: config.host })

  const shutdown = async () => {
    await app.close()
    await db.close()
    process.exit(0)
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
  return app
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  start().catch((error) => {
    console.error(error.message || error)
    process.exit(1)
  })
}
