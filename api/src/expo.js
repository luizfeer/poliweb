import { chunk, PUSH_BATCH_SIZE } from './segment.js'

const SEND_URL = 'https://exp.host/--/api/v2/push/send'
const RECEIPTS_URL = 'https://exp.host/--/api/v2/push/getReceipts'

export function isDeviceNotRegistered(ticket) {
  const code = ticket?.details?.error || ''
  const message = ticket?.message || ''
  return code === 'DeviceNotRegistered' || /DeviceNotRegistered/i.test(String(message))
}

export async function sendExpoMessages({ messages, fetchImpl, accessToken }) {
  const results = []
  const calls = []

  for (const batch of chunk(messages, PUSH_BATCH_SIZE)) {
    calls.push(batch.length)
    let response
    let json = {}
    try {
      response = await fetchImpl(SEND_URL, {
        method: 'POST',
        headers: expoHeaders(accessToken),
        body: JSON.stringify(batch)
      })
      json = await response.json()
    } catch (error) {
      for (const message of batch) {
        results.push({ token: message.to, status: 'failed', error: error.message || 'Falha ao falar com a Expo' })
      }
      continue
    }

    if (!response.ok || !Array.isArray(json.data)) {
      const error = json.errors?.[0]?.message || json.message || `HTTP ${response.status}`
      for (const message of batch) {
        results.push({ token: message.to, status: 'failed', error })
      }
      continue
    }

    batch.forEach((message, index) => {
      const ticket = json.data[index] || { status: 'error', message: 'Resposta vazia da Expo' }
      if (ticket.status === 'ok') {
        results.push({ token: message.to, status: 'sent', ticketId: ticket.id || null })
      } else if (isDeviceNotRegistered(ticket)) {
        results.push({ token: message.to, status: 'invalidated', error: 'DeviceNotRegistered' })
      } else {
        results.push({
          token: message.to,
          status: 'failed',
          error: ticket.message || ticket.details?.error || 'erro'
        })
      }
    })
  }

  return { results, batchSizes: calls }
}

export async function receiptInvalidations({ tickets, fetchImpl, accessToken }) {
  const byTicket = new Map()
  for (const ticket of tickets) {
    if (ticket.ticketId) byTicket.set(ticket.ticketId, ticket.token)
  }
  const invalidated = []

  for (const ids of chunk([...byTicket.keys()], PUSH_BATCH_SIZE)) {
    if (!ids.length) continue
    try {
      const response = await fetchImpl(RECEIPTS_URL, {
        method: 'POST',
        headers: expoHeaders(accessToken),
        body: JSON.stringify({ ids })
      })
      if (!response.ok) continue
      const json = await response.json()
      const data = json.data || {}
      for (const [id, receipt] of Object.entries(data)) {
        if (isDeviceNotRegistered(receipt)) {
          const token = byTicket.get(id)
          if (token) invalidated.push(token)
        }
      }
    } catch {
      // Recibo atrasado não desfaz o envio já aceito.
    }
  }

  return invalidated
}

function expoHeaders(accessToken) {
  const headers = {
    accept: 'application/json',
    'accept-encoding': 'gzip, deflate',
    'content-type': 'application/json'
  }
  if (accessToken) headers.authorization = `Bearer ${accessToken}`
  return headers
}
