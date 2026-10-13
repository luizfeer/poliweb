function splitList(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function readConfig(env = process.env) {
  const maxDevices = Number(env.PUSH_MAX_DEVICES || 20000)

  return {
    databaseUrl: env.DATABASE_URL || '',
    memoryDb: env.PUSH_DB === 'memory',
    port: Number(env.PORT || 5055),
    host: env.HOST || '127.0.0.1',
    jwtSecret: env.JWT_SECRET || '',
    adminSecret: env.PUSH_ADMIN_SECRET || '',
    upstreamApi: (env.UPSTREAM_API_URL || 'https://apiv4.poliwebapp.com.br').replace(/\/$/, ''),
    corsOrigins: splitList(env.CORS_ORIGINS),
    vapidPublicKey: env.VAPID_PUBLIC_KEY || '',
    vapidPrivateKey: env.VAPID_PRIVATE_KEY || '',
    vapidSubject: env.VAPID_SUBJECT || 'mailto:aplicativopoliweb@gmail.com',
    expoAccessToken: env.EXPO_ACCESS_TOKEN || '',
    publicSiteUrl: (env.PUBLIC_SITE_URL || 'https://www.poliwebapp.com.br').replace(/\/$/, ''),
    maxDevices: Number.isFinite(maxDevices) && maxDevices > 0 ? maxDevices : 20000
  }
}
