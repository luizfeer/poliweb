export type PushPermission = "granted" | "denied" | "undetermined";

export type NativePushPayload = {
  type: "poliweb-native-push";
  permission: PushPermission;
  expoPushToken: string | null;
  devicePushToken: string | null;
  platform: "ios" | "android";
};

/**
 * Entrega o token à página. O site ainda não tem Firebase nem web push;
 * o contrato é este evento, o localStorage e window.poliwebRegisterPushToken,
 * para o backend gravar quando existir um endpoint.
 */
export function buildPushBridgeScript(payload: NativePushPayload): string {
  const json = JSON.stringify(payload);
  return `
(function () {
  var payload = ${json};
  try { window.__POLIWEB_NATIVE_PUSH__ = payload; } catch (e) {}
  try { localStorage.setItem("poliweb_native_push", JSON.stringify(payload)); } catch (e) {}
  try {
    window.dispatchEvent(new CustomEvent("poliweb-native-push", { detail: payload }));
  } catch (e) {}
  try { window.postMessage(payload, "*"); } catch (e) {}
  try {
    if (typeof window.poliwebRegisterPushToken === "function") {
      window.poliwebRegisterPushToken(payload);
    }
  } catch (e) {}
})();
true;
`;
}
