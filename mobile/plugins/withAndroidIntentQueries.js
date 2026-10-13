const { withAndroidManifest } = require("expo/config-plugins");

/** Esquemas que o WebView manda para o sistema e a câmera do seletor de arquivo. */
const INTENTS = [
  { action: "android.intent.action.VIEW", scheme: "whatsapp" },
  { action: "android.intent.action.VIEW", scheme: "geo" },
  { action: "android.intent.action.VIEW", scheme: "tel" },
  { action: "android.intent.action.VIEW", scheme: "mailto" },
  { action: "android.intent.action.DIAL", scheme: "tel" },
  { action: "android.intent.action.SENDTO", scheme: "sms" },
  { action: "android.intent.action.SENDTO", scheme: "mailto" },
  { action: "android.media.action.IMAGE_CAPTURE" },
  { action: "android.media.action.VIDEO_CAPTURE" },
  { action: "android.intent.action.GET_CONTENT" },
];

function intentKey(intent) {
  const action = intent?.action?.[0]?.$?.["android:name"] ?? "";
  const scheme = intent?.data?.[0]?.$?.["android:scheme"] ?? "";
  return `${action}|${scheme}`;
}

/**
 * No Android 11+ um intent implícito só resolve se estiver em <queries>.
 * Sem IMAGE_CAPTURE o <input capture> do site não abre a câmera.
 */
function withAndroidIntentQueries(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    if (!Array.isArray(manifest.queries) || manifest.queries.length === 0) {
      manifest.queries = [{ intent: [] }];
    }
    const block = manifest.queries[0];
    block.intent = block.intent ?? [];
    const seen = new Set(block.intent.map(intentKey));
    for (const item of INTENTS) {
      const key = `${item.action}|${item.scheme ?? ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const intent = {
        action: [{ $: { "android:name": item.action } }],
      };
      if (item.scheme) {
        intent.data = [{ $: { "android:scheme": item.scheme } }];
      }
      block.intent.push(intent);
    }
    return config;
  });
}

module.exports = withAndroidIntentQueries;
