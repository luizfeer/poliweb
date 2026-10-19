/**
 * Esconde a splash e a navbar flutuante do site para não duplicar a intro
 * e a tab bar nativas, e avisa o app quando o Vue monta em #q-app.
 */
const NATIVE_SHELL_CSS = `
#pw-splash { display: none !important; }
.glass-navbar-wrapper { display: none !important; }
.has-glass-navbar { padding-bottom: 0 !important; }
body.has-glass-navbar .q-layout,
body.has-glass-navbar .q-page-container,
body.has-glass-navbar .q-page { padding-bottom: 0 !important; }
.download-modal { display: none !important; }
`.trim();

export const NATIVE_SHELL_SCRIPT = `
(function () {
  if (window.__poliwebNativeShellInstalled) return;
  window.__poliwebNativeShellInstalled = true;
  var css = ${JSON.stringify(NATIVE_SHELL_CSS)};
  var observer;
  var timer;
  var done = false;
  var errorCount = 0;
  function stopWatching() {
    if (observer) observer.disconnect();
    if (timer) clearInterval(timer);
  }
  function reportError(message, filename, line) {
    if (errorCount >= 5) return;
    errorCount += 1;
    try {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'poliweb-web-error',
        message: String(message || 'WebView JavaScript error').slice(0, 1000),
        filename: String(filename || '').split(/[?#]/)[0].slice(0, 500),
        line: typeof line === 'number' ? line : undefined
      }));
    } catch (e) {}
  }
  window.addEventListener('error', function (event) {
    if (event.message) reportError(event.message, event.filename, event.lineno);
    else {
      var target = event.target;
      var source = target && (target.src || target.href);
      if (source && window.location && source.indexOf(window.location.origin + '/js/') === 0) {
        reportError('WebView application script failed to load', source);
      }
    }
  }, true);
  window.addEventListener('unhandledrejection', function (event) {
    var reason = event.reason;
    reportError(reason && reason.message ? reason.message : 'Unhandled promise rejection');
  });
  window.addEventListener('pagehide', stopWatching);
  function mountStyle() {
    if (document.getElementById('poliweb-native-shell')) return;
    var style = document.createElement('style');
    style.id = 'poliweb-native-shell';
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  }
  function signal() {
    try {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'app-ready' }));
      }
    } catch (e) {}
  }
  window.poliwebRequestPushToken = function () {
    try {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'poliweb-push-request' }));
      }
    } catch (e) {}
  };
  // A WebView do Android não implementa a Web Share API, e o site caía no
  // fallback de copiar o link. Este polyfill pede ao app o share sheet nativo.
  if (window.navigator && typeof window.navigator.share !== 'function') {
    var pendingShares = {};
    var shareSeq = 0;
    window.__poliwebShareResult = function (id, outcome) {
      var pending = pendingShares[id];
      if (!pending) return;
      delete pendingShares[id];
      if (outcome === 'shared') { pending.resolve(); return; }
      var error = new Error(outcome === 'dismissed' ? 'Share canceled' : 'Native share failed');
      error.name = outcome === 'dismissed' ? 'AbortError' : 'NotAllowedError';
      pending.reject(error);
    };
    var nativeShare = function (data) {
      return new Promise(function (resolve, reject) {
        data = data || {};
        if (!window.ReactNativeWebView || !window.ReactNativeWebView.postMessage || (!data.title && !data.text && !data.url)) {
          var unsupported = new Error('Native share unavailable');
          unsupported.name = 'TypeError';
          reject(unsupported);
          return;
        }
        shareSeq += 1;
        pendingShares[shareSeq] = { resolve: resolve, reject: reject };
        try {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'poliweb-share',
            id: shareSeq,
            title: data.title ? String(data.title) : undefined,
            text: data.text ? String(data.text) : undefined,
            url: data.url ? String(new URL(String(data.url), window.location.href)) : undefined
          }));
        } catch (e) {
          delete pendingShares[shareSeq];
          reject(e);
        }
      });
    };
    var nativeCanShare = function (data) {
      return !!data && !data.files && !!(data.title || data.text || data.url);
    };
    try {
      Object.defineProperty(window.navigator, 'share', { configurable: true, writable: true, value: nativeShare });
      Object.defineProperty(window.navigator, 'canShare', { configurable: true, writable: true, value: nativeCanShare });
    } catch (e) {
      try { window.navigator.share = nativeShare; window.navigator.canShare = nativeCanShare; } catch (e2) {}
    }
  }
  function ready() {
    var root = document.getElementById('q-app');
    return !!(root && root.childElementCount > 0);
  }
  mountStyle();
  function check() {
    if (done || !ready()) return;
    done = true;
    stopWatching();
    signal();
  }
  if (ready()) { check(); return; }
  try {
    observer = new MutationObserver(check);
    observer.observe(document.documentElement, { childList: true, subtree: true });
  } catch (e) {}
  var ticks = 0;
  timer = setInterval(function () {
    ticks += 1;
    check();
    if (done || ticks > 150) stopWatching();
  }, 200);
})();
true;
`;
