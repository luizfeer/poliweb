import type { AgentBlock, CtaButton } from '@/lib/ai/city-agent-client';

const DB_NAME = 'carmo-chat-db';
const DB_VERSION = 1;
const STORE_NAME = 'sessions';

export const LAST_SESSION_STORAGE_KEY = 'carmo-chat-last-session-id';

export interface StoredMessage {
  role: 'user' | 'assistant';
  text: string | null;
  hits: unknown[];
  /** Resposta estruturada do city-agent (quando não há `answer` em texto plano). */
  blocks?: AgentBlock[];
  /** Botões de ação que apontam para páginas relevantes do site */
  cta?: CtaButton[];
  aiNotice?: { label: string; href: string | null } | null;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: StoredMessage[];
  createdAt: number;
  updatedAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
    };
  });
}

export async function getAllSessions(): Promise<ChatSession[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const idx = store.index('updatedAt');
    const req = idx.openCursor(null, 'prev');
    const results: ChatSession[] = [];
    req.onsuccess = (e) => {
      const cursor = (e.target as IDBRequest).result;
      if (cursor) {
        results.push(cursor.value as ChatSession);
        cursor.continue();
      } else {
        resolve(results);
      }
    };
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

export async function getSession(id: string): Promise<ChatSession | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);
    req.onsuccess = () => resolve((req.result as ChatSession) ?? null);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

export async function saveSession(session: ChatSession): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put({ ...session, updatedAt: Date.now() });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

export async function deleteSession(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
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
