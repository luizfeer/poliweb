import crypto from 'node:crypto'

import { countSegment, invalidateTokens, listSegment } from './devices.js'
import { httpError } from './errors.js'
import { receiptInvalidations, sendExpoMessages } from './expo.js'
import { sendWebPushMessages } from './webpush.js'

export async function estimateSegment(db, filters) {
  return countSegment(db, filters)
}

export async function sendCampaign({ db, message, session, expoFetch, webPush, config }) {
  const estimate = await countSegment(db, message.filters)
  if (estimate.count > config.maxDevices) {
    throw httpError(
      400,
      `O segmento tem ${estimate.count} dispositivos, acima do limite de ${config.maxDevices}.`
    )
  }

  const devices = await listSegment(db, message.filters)
  const id = crypto.randomUUID()
  const url = `${config.publicSiteUrl}${message.path}`
  await db.query(
    `
    INSERT INTO push_campaigns (
      id, title, body, path, filters, estimated_count, targeted_count, status, created_by, created_at
    ) VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, 'sending', $8, NOW())
    `,
    [
      id,
      message.title,
      message.body,
      message.path,
      JSON.stringify(message.filters),
      estimate.count,
      devices.length,
      session.email || session.userId || 'admin'
    ]
  )

  try {
    const expoDevices = devices.filter((device) => device.tokenType === 'expo')
    const webDevices = devices.filter((device) => device.tokenType === 'webpush')
    const data = { path: message.path, url }
    const expoSend = await sendExpoMessages({
      messages: expoDevices.map((device) => ({
        to: device.token,
        title: message.title,
        body: message.body,
        sound: 'default',
        priority: 'high',
        channelId: 'default',
        data
      })),
      fetchImpl: expoFetch,
      accessToken: config.expoAccessToken
    })
    const receiptTokens = await receiptInvalidations({
      tickets: expoSend.results,
      fetchImpl: expoFetch,
      accessToken: config.expoAccessToken
    })
    const invalidatedByReceipt = new Set(receiptTokens)
    const expoResults = expoSend.results.map((item) => (
      item.status === 'sent' && invalidatedByReceipt.has(item.token)
        ? { ...item, status: 'invalidated', error: 'DeviceNotRegistered' }
        : item
    ))

    const webSend = await sendWebPushMessages({
      devices: webDevices,
      payload: JSON.stringify({
        title: message.title,
        body: message.body,
        path: message.path,
        url
      }),
      client: webPush
    })

    const results = [...expoResults, ...webSend.results]
    const invalidatedExpo = unique(expoResults.filter((item) => item.status === 'invalidated').map((item) => item.token))
    const invalidatedWeb = unique(webSend.results.filter((item) => item.status === 'invalidated').map((item) => item.token))
    await invalidateTokens(db, 'expo', invalidatedExpo)
    await invalidateTokens(db, 'webpush', invalidatedWeb)

    const totals = tally(results)
    return finishCampaign(db, id, {
      status: 'sent',
      sentCount: totals.sent,
      failedCount: totals.failed,
      invalidatedCount: totals.invalidated,
      error: null
    })
  } catch (error) {
    await finishCampaign(db, id, {
      status: 'failed',
      sentCount: 0,
      failedCount: devices.length,
      invalidatedCount: 0,
      error: error.message || 'Falha no disparo'
    })
    throw error
  }
}

export async function listCampaigns(db, limit) {
  const result = await db.query(
    `
    SELECT id, title, body, path, filters, estimated_count, targeted_count,
           sent_count, failed_count, invalidated_count, status, error, created_by,
           created_at, finished_at
    FROM push_campaigns
    ORDER BY created_at DESC
    LIMIT $1
    `,
    [limit]
  )
  return result.rows.map(mapCampaign)
}

async function finishCampaign(db, id, patch) {
  const result = await db.query(
    `
    UPDATE push_campaigns
    SET status = $2,
        sent_count = $3,
        failed_count = $4,
        invalidated_count = $5,
        error = $6,
        finished_at = NOW()
    WHERE id = $1
    RETURNING id, title, body, path, filters, estimated_count, targeted_count,
              sent_count, failed_count, invalidated_count, status, error, created_by,
              created_at, finished_at
    `,
    [id, patch.status, patch.sentCount, patch.failedCount, patch.invalidatedCount, patch.error]
  )
  return mapCampaign(result.rows[0])
}

function mapCampaign(row) {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    path: row.path,
    filters: typeof row.filters === 'string' ? JSON.parse(row.filters) : row.filters,
    estimatedCount: Number(row.estimated_count),
    targetedCount: Number(row.targeted_count),
    sentCount: Number(row.sent_count),
    failedCount: Number(row.failed_count),
    invalidatedCount: Number(row.invalidated_count),
    status: row.status,
    error: row.error,
    createdBy: row.created_by,
    createdAt: row.created_at,
    finishedAt: row.finished_at
  }
}

function tally(results) {
  return results.reduce((acc, item) => {
    if (item.status === 'sent') acc.sent += 1
    else if (item.status === 'invalidated') acc.invalidated += 1
    else acc.failed += 1
    return acc
  }, { sent: 0, failed: 0, invalidated: 0 })
}

function unique(items) {
  return [...new Set(items)]
}
