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
  var css = ${JSON.stringify(NATIVE_SHELL_CSS)};
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
  function ready() {
    var root = document.getElementById('q-app');
    return !!(root && root.childElementCount > 0);
  }
  mountStyle();
  if (ready()) { signal(); return; }
  var done = false;
  function check() {
    if (done || !ready()) return;
    done = true;
    signal();
  }
  try {
    new MutationObserver(check).observe(document.documentElement, { childList: true, subtree: true });
  } catch (e) {}
  var ticks = 0;
  var timer = setInterval(function () {
    ticks += 1;
    check();
    if (done || ticks > 150) clearInterval(timer);
  }, 200);
})();
true;
`;
