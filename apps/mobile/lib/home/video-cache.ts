import * as FileSystem from 'expo-file-system/legacy';

const DIR = `${FileSystem.cacheDirectory}home-videos/`;
const MAX_BYTES = 200 * 1024 * 1024; // 200 MB

const inflight = new Map<string, Promise<string | null>>();

function hashUrl(url: string): string {
  let h = 5381;
  for (let i = 0; i < url.length; i++) {
    h = ((h << 5) + h + url.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
}

function extFromUrl(url: string): string {
  try {
    const path = new URL(url).pathname;
    const dot = path.lastIndexOf('.');
    if (dot < 0) return '.mp4';
    const ext = path.slice(dot).toLowerCase();
    if (/^\.[a-z0-9]{2,5}$/.test(ext)) return ext;
    return '.mp4';
  } catch {
    return '.mp4';
  }
}

function fileForUrl(url: string): string {
  return `${DIR}${hashUrl(url)}${extFromUrl(url)}`;
}

async function ensureDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(DIR, { intermediates: true });
  }
}

/**
 * Garante que o vídeo da URL remota está cacheado localmente.
 * Retorna o file:// URI se já existe; baixa em background e devolve `null` na primeira vez.
 */
export async function ensureVideoCached(remoteUrl: string): Promise<string | null> {
  if (!remoteUrl || remoteUrl.startsWith('file://')) return remoteUrl || null;
  try {
    await ensureDir();
    const target = fileForUrl(remoteUrl);
    const info = await FileSystem.getInfoAsync(target);
    if (info.exists && info.size && info.size > 0) {
      return target;
    }
    let job = inflight.get(remoteUrl);
    if (!job) {
      job = (async () => {
        try {
          const res = await FileSystem.downloadAsync(remoteUrl, target);
          if (res.status >= 200 && res.status < 300) return res.uri;
          try {
            await FileSystem.deleteAsync(target, { idempotent: true });
          } catch {
            // ignora
          }
          return null;
        } catch {
          return null;
        } finally {
          inflight.delete(remoteUrl);
        }
      })();
      inflight.set(remoteUrl, job);
    }
    // Não bloqueia o caller — a próxima abertura usa o arquivo já baixado.
    void job;
    return null;
  } catch {
    return null;
  }
}

/** Retorna URI local se já existe em disco; caso contrário `null`. */
export async function getCachedVideoUri(remoteUrl: string): Promise<string | null> {
  if (!remoteUrl) return null;
  if (remoteUrl.startsWith('file://')) return remoteUrl;
  try {
    const target = fileForUrl(remoteUrl);
    const info = await FileSystem.getInfoAsync(target);
    if (info.exists && info.size && info.size > 0) return target;
    return null;
  } catch {
    return null;
  }
}

/** Apaga arquivos não referenciados pela lista atual. Mantém pasta < MAX_BYTES. */
export async function pruneVideoCache(keepUrls: string[]): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(DIR);
    if (!info.exists) return;
    const keepNames = new Set(keepUrls.map((u) => fileForUrl(u).slice(DIR.length)));
    const names = await FileSystem.readDirectoryAsync(DIR);

    type Entry = { name: string; size: number; mtime: number };
    const survivors: Entry[] = [];

    for (const name of names) {
      const full = DIR + name;
      if (!keepNames.has(name)) {
        await FileSystem.deleteAsync(full, { idempotent: true });
        continue;
      }
      const fi = await FileSystem.getInfoAsync(full);
      if (fi.exists) {
        survivors.push({
          name,
          size: fi.size ?? 0,
          mtime: fi.modificationTime ?? 0,
        });
      }
    }

    let total = survivors.reduce((acc, e) => acc + e.size, 0);
    if (total <= MAX_BYTES) return;

    survivors.sort((a, b) => a.mtime - b.mtime);
    for (const e of survivors) {
      if (total <= MAX_BYTES) break;
      await FileSystem.deleteAsync(DIR + e.name, { idempotent: true });
      total -= e.size;
    }
  } catch {
    // noop
  }
}

export async function clearVideoCache(): Promise<void> {
  try {
    await FileSystem.deleteAsync(DIR, { idempotent: true });
  } catch {
    // noop
  }
}
