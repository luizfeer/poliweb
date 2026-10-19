import assert from "node:assert/strict";
import { test } from "node:test";
import vm from "node:vm";
import { NATIVE_SHELL_SCRIPT } from "./nativeShellScript.ts";

function page() {
  let ready = false;
  let observerCallback = () => {};
  let intervalCallback = () => {};
  let disconnected = 0;
  let cleared = 0;
  let observers = 0;
  const messages: Array<{ type: string; message?: string }> = [];
  const listeners: Record<string, (event: any) => void> = {};
  const context = vm.createContext({
    window: {
      location: { origin: "https://www.poliwebapp.com.br" },
      addEventListener(name: string, cb: (event: any) => void) { listeners[name] = cb; },
      ReactNativeWebView: { postMessage(value: string) { messages.push(JSON.parse(value)); } },
    },
    document: {
      getElementById(id: string) { return id === "q-app" && ready ? { childElementCount: 1 } : null; },
      createElement() { return {}; },
      head: { appendChild() {} },
      documentElement: {},
    },
    MutationObserver: class {
      constructor(cb: () => void) { observerCallback = cb; observers += 1; }
      observe() {}
      disconnect() { disconnected += 1; }
    },
    setInterval(cb: () => void) { intervalCallback = cb; return 1; },
    clearInterval() { cleared += 1; },
  });
  return {
    context, messages, listeners,
    ready() { ready = true; observerCallback(); },
    tick() { intervalCallback(); },
    get counters() { return { disconnected, cleared, observers }; },
  };
}

test("double WebView injection installs only one observer and disconnects when ready", () => {
  const p = page();
  vm.runInContext(NATIVE_SHELL_SCRIPT, p.context);
  vm.runInContext(NATIVE_SHELL_SCRIPT, p.context);
  assert.equal(p.counters.observers, 1);
  p.ready();
  p.tick();
  assert.equal(p.messages.filter(m => m.type === "app-ready").length, 1);
  assert.ok(p.counters.disconnected > 0);
  assert.ok(p.counters.cleared > 0);
});

test("a page which never mounts stops observing after the timeout", () => {
  const p = page();
  vm.runInContext(NATIVE_SHELL_SCRIPT, p.context);
  for (let i = 0; i < 151; i += 1) p.tick();
  assert.ok(p.counters.disconnected > 0);
  assert.ok(p.counters.cleared > 0);
});

test("page errors are bounded to avoid flooding the native message bridge", () => {
  const p = page();
  vm.runInContext(NATIVE_SHELL_SCRIPT, p.context);
  for (let i = 0; i < 20; i += 1) p.listeners.error({ message: "broken", filename: "app.js?secret=x" });
  assert.equal(p.messages.length, 5);
  assert.ok(p.messages.every(m => m.type === "poliweb-web-error"));
  assert.ok(!JSON.stringify(p.messages).includes("secret"));
});

test("reports a failed application script even before the web app can initialize Sentry", () => {
  const p = page();
  vm.runInContext(NATIVE_SHELL_SCRIPT, p.context);
  p.listeners.error({ target: { src: "https://www.poliwebapp.com.br/js/missing.js" } });
  p.listeners.error({ target: { src: "https://ads.example.com/blocked.js" } });
  assert.equal(p.messages.length, 1);
  assert.equal(p.messages[0].message, "WebView application script failed to load");
});
