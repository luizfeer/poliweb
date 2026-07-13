(function () {
  var key = 'poliweb_legacy_chunk_common_e6a3fe80_reloaded'

  function showFallback() {
    try {
      document.body.innerHTML = [
        '<div style="font-family:Arial,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:#f8fafc;color:#0f172a">',
        '<div style="max-width:420px;text-align:center">',
        '<h1 style="font-size:22px;margin:0 0 10px">Atualizacao necessaria</h1>',
        '<p style="font-size:15px;line-height:1.45;margin:0 0 18px;color:#475569">O aplicativo carregou uma versao antiga. Toque em atualizar para buscar a versao nova.</p>',
        '<button onclick="location.reload()" style="border:0;border-radius:8px;background:#2563eb;color:white;font-weight:700;padding:12px 18px;font-size:15px">Atualizar</button>',
        '</div>',
        '</div>'
      ].join('')
    } catch (_) {}
  }

  function reload() {
    var separator = window.location.search ? '&' : '?'
    window.location.replace(window.location.pathname + window.location.search + separator + 'appReload=' + Date.now() + window.location.hash)
  }

  function recover() {
    if (window.sessionStorage && window.sessionStorage.getItem(key)) {
      showFallback()
      return
    }

    try {
      window.sessionStorage && window.sessionStorage.setItem(key, '1')
    } catch (_) {}

    var work = []
    try {
      if ('caches' in window) {
        work.push(window.caches.keys().then(function (keys) {
          return Promise.all(keys.map(function (cacheKey) {
            return window.caches.delete(cacheKey)
          }))
        }))
      }
    } catch (_) {}

    try {
      if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) {
        work.push(navigator.serviceWorker.getRegistrations().then(function (registrations) {
          return Promise.all(registrations.map(function (registration) {
            return registration.unregister()
          }))
        }))
      }
    } catch (_) {}

    Promise.all(work).then(reload).catch(reload)
  }

  recover()
}())
