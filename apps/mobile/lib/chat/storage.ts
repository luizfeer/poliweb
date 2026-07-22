import * as SQLite from 'expo-sqlite';

import type { ChatSession, StoredMessage } from '@/lib/chat/types';

const DB_NAME = 'carmo-chat.db';
const META_LAST_SESSION = 'last_session_id';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function openAndInit(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      messages_json TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_updated
      ON sessions (updated_at DESC);
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
  return db;
}

function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) dbPromise = openAndInit();
  return dbPromise;
}

type SessionRow = {
  id: string;
  title: string;
  created_at: number;
  updated_at: number;
  messages_json: string;
};

function rowToSession(row: SessionRow): ChatSession {
  let messages: StoredMessage[] = [];
  try {
    const parsed = JSON.parse(row.messages_json);
    if (Array.isArray(parsed)) messages = parsed;
  } catch {
    messages = [];
  }
  return {
    id: row.id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    messages,
  };
}

export async function getAllSessions(): Promise<ChatSession[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<SessionRow>(
    'SELECT id, title, created_at, updated_at, messages_json FROM sessions ORDER BY updated_at DESC LIMIT 100',
  );
  return rows.map(rowToSession);
}

export async function saveSession(session: ChatSession): Promise<void> {
  const db = await getDb();
  const updatedAt = Date.now();
  await db.runAsync(
    `INSERT INTO sessions (id, title, created_at, updated_at, messages_json)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       title = excluded.title,
       updated_at = excluded.updated_at,
       messages_json = excluded.messages_json`,
    [
      session.id,
      session.title,
      session.createdAt,
      updatedAt,
      JSON.stringify(session.messages),
    ],
  );
}

export async function deleteSession(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM sessions WHERE id = ?', [id]);
}

export async function renameSession(id: string, title: string): Promise<void> {
  const db = await getDb();
  const trimmed = title.trim().slice(0, 80) || 'Nova conversa';
  await db.runAsync(
    'UPDATE sessions SET title = ?, updated_at = ? WHERE id = ?',
    [trimmed, Date.now(), id],
  );
}

export async function getLastSessionId(): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM meta WHERE key = ?',
    [META_LAST_SESSION],
  );
  return row?.value ?? null;
}

export async function setLastSessionId(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO meta (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [META_LAST_SESSION, id],
  );
}

export function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function makeSessionTitle(messages: StoredMessage[]): string {
  const firstUser = messages.find((m) => m.role === 'user');
  if (firstUser?.text) {
    const t = firstUser.text.trim();
    return t.length > 40 ? `${t.slice(0, 40)}…` : t;
  }
  return 'Nova conversa';
}
