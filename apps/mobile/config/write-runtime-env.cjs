const { writeFileSync } = require('node:fs');
const { resolve } = require('node:path');

const { envFlag, loadMobileEnv } = require('./load-mobile-env.cjs');
const { formatWebEnvLabel, resolveWebBaseUrl } = require('./resolve-web-base-url.cjs');

const loaded = loadMobileEnv();
const forceLocalDev = envFlag(loaded.EXPO_PUBLIC_ALLOW_LOCALHOST_WEB_URL);
const web = resolveWebBaseUrl({
  envUrl: loaded.EXPO_PUBLIC_WEB_URL,
  forceLocalDev,
});

const runtime = {
  webBaseUrl: web.url,
  webEnv: web.mode,
  forceLocalDev,
  webEnvLabel: formatWebEnvLabel(web),
};

const outPath = resolve(__dirname, '../lib/env.runtime.ts');
const contents = `/** Gerado por config/write-runtime-env.cjs — não editar manualmente. */
export const mobileRuntimeEnv = ${JSON.stringify(runtime, null, 2)} as const;
`;

writeFileSync(outPath, contents, 'utf8');
console.info('[mobile:env] runtime written →', runtime.webEnvLabel, runtime.webBaseUrl);
