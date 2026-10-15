import assert from "node:assert/strict";
import { test } from "node:test";

import { buildPushBridgeScript } from "./pushBridge.ts";

test("o script entrega o token Expo e o token APNs para a página", () => {
  const script = buildPushBridgeScript({
    type: "poliweb-native-push",
    permission: "granted",
    expoPushToken: "ExponentPushToken[abc]",
    devicePushToken: "apns-device-token",
    platform: "ios",
  });

  assert.match(script, /ExponentPushToken\[abc\]/);
  assert.match(script, /apns-device-token/);
  assert.match(script, /poliweb-native-push/);
  assert.match(script, /poliwebRegisterPushToken/);
  assert.match(script, /localStorage\.setItem/);
  assert.match(script, /window\.postMessage/);
});

test("aspas no token não quebram o JavaScript injetado", () => {
  const script = buildPushBridgeScript({
    type: "poliweb-native-push",
    permission: "denied",
    expoPushToken: null,
    devicePushToken: 'a"b\\c',
    platform: "ios",
  });

  assert.match(script, /a\\"b\\\\c/);
  assert.doesNotMatch(script, /devicePushToken":"a"b/);
});
