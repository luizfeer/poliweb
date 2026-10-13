import pg from 'pg'

export function createPgDb(pool) {
  return {
    async query(text, params = []) {
      const result = await pool.query(text, params)
      return { rows: result.rows }
    },
    async exec(text) {
      await pool.query(text)
    },
    async close() {
      await pool.end()
    }
  }
}

export function createPgliteDb(pglite) {
  return {
    async query(text, params = []) {
      const result = await pglite.query(text, params)
      return { rows: result.rows }
    },
    async exec(text) {
      await pglite.exec(text)
    },
    async close() {
      await pglite.close()
    }
  }
}

export function createPgPool(databaseUrl) {
  return new pg.Pool({ connectionString: databaseUrl })
}
