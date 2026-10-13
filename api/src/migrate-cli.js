import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { readConfig } from './config.js'
import { createPgDb } from './db.js'
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
      if (key && process.env[key] === undefined) process.env[key] = trimmed.slice(eq + 1).trim()
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
}

await loadEnvFile()
const config = readConfig()
if (!config.databaseUrl) {
  console.error('Defina DATABASE_URL para aplicar a migração.')
  process.exit(1)
}

const pg = await import('pg')
const client = new pg.default.Client({ connectionString: config.databaseUrl })
await client.connect()
try {
  const applied = await migrate(createPgDb(client))
  console.log(applied.length ? `Migrações aplicadas: ${applied.join(', ')}` : 'Nenhuma migração nova.')
} finally {
  await client.end()
}
