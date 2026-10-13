import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const migrationsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../migrations')

export function splitSql(sql) {
  return sql
    .split(';')
    .map((part) => part.trim())
    .filter((part) => part.split('\n').some((line) => {
      const trimmed = line.trim()
      return trimmed && !trimmed.startsWith('--')
    }))
}

export async function migrate(db, directory = migrationsDir) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  const files = (await readdir(directory)).filter((name) => name.endsWith('.sql')).sort()
  const applied = []

  for (const file of files) {
    const existing = await db.query('SELECT id FROM schema_migrations WHERE id = $1', [file])
    if (existing.rows.length) continue

    const sql = await readFile(path.join(directory, file), 'utf8')
    for (const statement of splitSql(sql)) {
      await db.exec(statement)
    }
    await db.query('INSERT INTO schema_migrations (id) VALUES ($1) ON CONFLICT (id) DO NOTHING', [file])
    applied.push(file)
  }

  return applied
}
