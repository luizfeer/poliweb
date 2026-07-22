const { existsSync, readFileSync } = require('node:fs');
const { resolve } = require('node:path');

const ENV_PATH = resolve(__dirname, '../.env');

function parseEnvFile(content) {
  const env = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

function loadMobileEnv() {
  if (!existsSync(ENV_PATH)) return {};

  const parsed = parseEnvFile(readFileSync(ENV_PATH, 'utf8'));
  for (const [key, value] of Object.entries(parsed)) {
    process.env[key] = value;
  }
  return parsed;
}

function envFlag(value) {
  if (!value) return false;
  const normalized = String(value).trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes';
}

module.exports = {
  loadMobileEnv,
  envFlag,
  MOBILE_ENV_PATH: ENV_PATH,
};
