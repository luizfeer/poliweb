function isCacheable(req) {
  return req.method === 'GET'
}

function cacheKeyFrom(request) {
  // Se você tiver variações por idioma, mobile, etc, pode incluir headers aqui.
  const url = new URL(request.url)
  return new Request(url.toString(), { method: 'GET' })
}

function parseTtl(env) {
  const n = Number(env.CACHE_TTL_SECONDS || 0)
  return Number.isFinite(n) && n >= 0 ? n : 0
}

function looksLikeAssetPath(pathname) {
  // Evita interceptar assets servidos pelo Pages (css/js/img/fonts/etc).
  // Também cobre casos de paths "relativos" como /comercio/5020/assets/...
  const p = pathname.toLowerCase()
  return (
    p.includes('/assets/') ||
    p.includes('/icons/') ||
    p.includes('/img/') ||
    p.includes('/images/') ||
    p.endsWith('.js') ||
    p.endsWith('.css') ||
    p.endsWith('.map') ||
    p.endsWith('.json') ||
    p.endsWith('.png') ||
    p.endsWith('.jpg') ||
    p.endsWith('.jpeg') ||
    p.endsWith('.webp') ||
    p.endsWith('.gif') ||
    p.endsWith('.svg') ||
    p.endsWith('.ico') ||
    p.endsWith('.txt') ||
    p.endsWith('.xml') ||
    p.endsWith('.woff') ||
    p.endsWith('.woff2') ||
    p.endsWith('.ttf') ||
    p.endsWith('.otf') ||
    p.endsWith('.eot') ||
    p.endsWith('.mp4') ||
    p.endsWith('.webm') ||
    p.endsWith('.mp3') ||
    p.endsWith('.pdf')
  )
}

function isHtmlRequest(request) {
  const accept = request.headers.get('accept') || ''
  return accept.includes('text/html') || accept.includes('application/xhtml+xml')
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)

    // Segurança: este Worker deve ser roteado apenas para /comercio/*
    if (!url.pathname.startsWith('/comercio/')) {
      return fetch(request)
    }

    // Não intercepta assets: deixa o Pages responder normalmente.
    if (looksLikeAssetPath(url.pathname)) {
      return fetch(request)
    }

    // Intercepta só navegação HTML (evita quebrar fetches/api/etc).
    if (!isHtmlRequest(request)) {
      return fetch(request)
    }

    const origin = (env.SSR_ORIGIN || '').replace(/\/$/, '')
    if (!origin) {
      return new Response('SSR_ORIGIN não configurado', { status: 500 })
    }

    // Só cacheia GET de HTML
    const ttl = parseTtl(env)
    const canCache = isCacheable(request)

    const key = cacheKeyFrom(request)
    if (canCache && ttl > 0) {
      const cached = await caches.default.match(key)
      if (cached) {
        const hit = new Response(cached.body, cached)
        hit.headers.set('CF-Cache-Status', 'HIT')
        return hit
      }
    }

    const target = new URL(origin)
    target.pathname = url.pathname
    target.search = url.search

    // Repassa request, mas força Host do origin (alguns servers precisam)
    const headers = new Headers(request.headers)
    headers.set('Host', target.host)
    // Evita cache indevido por encoding variado
    headers.delete('accept-encoding')
    // Garantia: pedimos HTML
    if (!headers.has('accept')) {
      headers.set('accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8')
    }

    const upstreamReq = new Request(target.toString(), {
      method: request.method,
      headers,
      body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
      redirect: 'manual'
    })

    let res
    try {
      res = await fetch(upstreamReq)
    } catch (e) {
      // Modo de falha: volta para o Pages (SPA) em vez de erro 522.
      // Converte /comercio/:id/:slug -> /:id/:slug
      const parts = url.pathname.split('/').filter(Boolean) // ["comercio", id, slug...]
      const id = parts[1]
      const slug = parts.slice(2).join('/') || ''
      const fallback = new URL(request.url)
      fallback.pathname = `/${id || ''}${slug ? '/' + slug : ''}`
      return Response.redirect(fallback.toString(), 302)
    }

    // Não cacheia respostas ruins ou não-HTML
    const contentType = res.headers.get('content-type') || ''
    const isHtml = contentType.includes('text/html') || contentType.includes('application/xhtml+xml')
    const okToCache = canCache && ttl > 0 && res.ok && isHtml

    const out = new Response(res.body, res)
    out.headers.set('CF-Cache-Status', okToCache ? 'MISS' : 'BYPASS')
    if (okToCache) {
      out.headers.set('Cache-Control', `public, max-age=0, s-maxage=${ttl}, stale-while-revalidate=${ttl}`)
      ctx.waitUntil(caches.default.put(key, out.clone()))
    }
    return out
  }
}

