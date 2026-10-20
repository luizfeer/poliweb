import assert from 'node:assert/strict'
import { test } from 'node:test'

import { copyText, shareLink, shareNotice } from './share.js'

const data = { title: 'Padaria', text: 'Confira', url: 'https://www.poliwebapp.com.br/comercio/7' }

function clipboard () {
  const copied = []
  return { copied, writeText: async (text) => { copied.push(text) } }
}

test('uses the share sheet and does not copy when share works', async () => {
  const shared = []
  const board = clipboard()
  const result = await shareLink(data, { navigator: { share: async (d) => { shared.push(d) }, clipboard: board } })
  assert.equal(result, 'shared')
  assert.deepEqual(shared, [data])
  assert.deepEqual(board.copied, [])
})

test('closing the share sheet does not copy the link', async () => {
  const board = clipboard()
  const abort = Object.assign(new Error('canceled'), { name: 'AbortError' })
  const result = await shareLink(data, { navigator: { share: async () => { throw abort }, clipboard: board } })
  assert.equal(result, 'cancelled')
  assert.deepEqual(board.copied, [])
})

test('copies the link only when share fails or is missing', async () => {
  const board = clipboard()
  const failing = { share: async () => { throw new Error('boom') }, clipboard: board }
  assert.equal(await shareLink(data, { navigator: failing }), 'copied')
  assert.equal(await shareLink(data, { navigator: { clipboard: board } }), 'copied')
  assert.deepEqual(board.copied, [data.url, data.url])
})

test('falls back to execCommand when the clipboard API is blocked', async () => {
  const appended = []
  const document = {
    body: { appendChild: (el) => appended.push(el), removeChild: () => {} },
    createElement: () => ({ style: {}, setAttribute () {}, select () {} }),
    execCommand: (cmd) => cmd === 'copy'
  }
  const navigator = { clipboard: { writeText: async () => { throw new Error('denied') } } }
  assert.equal(await copyText(data.url, { navigator, document }), true)
  assert.equal(appended[0].value, data.url)
  assert.equal(await shareLink(data, { navigator: {}, document: undefined }), 'failed')
})

test('a cancelled share shows no notice', () => {
  assert.equal(shareNotice('cancelled'), null)
  assert.equal(shareNotice('copied').message, 'Link copiado!')
})
