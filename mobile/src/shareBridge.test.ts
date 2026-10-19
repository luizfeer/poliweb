import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildShareResultScript,
  nativeShareContent,
  parseShareRequest,
} from "./shareBridge.ts";

test("accepts a share request with an https link and trims its fields", () => {
  assert.deepEqual(
    parseShareRequest({ type: "poliweb-share", id: 3, title: " Padaria ", text: "Confira", url: "https://www.poliwebapp.com.br/comercio/7" }),
    { id: 3, title: "Padaria", text: "Confira", url: "https://www.poliwebapp.com.br/comercio/7" },
  );
});

test("rejects other messages, bad ids, empty content and non-http links", () => {
  assert.equal(parseShareRequest({ type: "app-ready" }), null);
  assert.equal(parseShareRequest({ type: "poliweb-share", id: "1", url: "https://a.b/" }), null);
  assert.equal(parseShareRequest({ type: "poliweb-share", id: 1 }), null);
  assert.equal(parseShareRequest({ type: "poliweb-share", id: 1, url: "javascript:alert(1)" }), null);
  assert.deepEqual(parseShareRequest({ type: "poliweb-share", id: 1, title: "x", url: "intent://x" }), { id: 1, title: "x", text: undefined, url: undefined });
});

test("Android puts the link inside the message, because Share ignores url there", () => {
  const request = { id: 1, title: "Padaria", text: "Confira", url: "https://www.poliwebapp.com.br/comercio/7" };
  assert.deepEqual(nativeShareContent(request, "android"), {
    title: "Padaria",
    message: "Confira\nhttps://www.poliwebapp.com.br/comercio/7",
  });
  assert.deepEqual(nativeShareContent({ id: 2, title: "Só título" }, "android"), { title: "Só título", message: "Só título" });
});

test("iOS passes the url separately for the link preview", () => {
  const request = { id: 1, title: "Padaria", text: "Confira", url: "https://www.poliwebapp.com.br/comercio/7" };
  assert.deepEqual(nativeShareContent(request, "ios"), {
    title: "Padaria",
    message: "Confira",
    url: "https://www.poliwebapp.com.br/comercio/7",
  });
});

test("the result script resolves the pending promise by id", () => {
  const script = buildShareResultScript(4, "dismissed");
  assert.match(script, /__poliwebShareResult\(4, "dismissed"\)/);
});
