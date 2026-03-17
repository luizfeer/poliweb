import { db } from 'src/db/db'

const STORE = 'videoThumbs'

export async function getVideoThumb(videoId) {
  try {
    const row = await db[STORE].get(String(videoId))
    return row?.dataUrl ?? null
  } catch {
    return null
  }
}

export async function setVideoThumb(videoId, dataUrl) {
  try {
    await db[STORE].put({ id: String(videoId), dataUrl })
  } catch {
    // ignore storage errors
  }
}

export async function loadVideoThumbs(videoIds) {
  const result = {}
  try {
    const rows = await db[STORE].bulkGet(videoIds.map((id) => String(id)))
    rows.forEach((row, i) => {
      if (row?.dataUrl) {
        result[videoIds[i]] = row.dataUrl
      }
    })
  } catch {
    // ignore
  }
  return result
}
