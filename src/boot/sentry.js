import { boot } from 'quasar/wrappers'
import * as Sentry from '@sentry/vue'

const SENTRY_DSN = 'https://3ad4431af3964cc0906883485e60bdb0@o4511572791984128.ingest.us.sentry.io/4511572793753600'

export default boot(({ app, router }) => {
  if (typeof window === 'undefined') return

  Sentry.init({
    app,
    dsn: SENTRY_DSN,
    environment: 'production',
    integrations: [
      Sentry.browserTracingIntegration({ router }),
      Sentry.captureConsoleIntegration({
        levels: ['error', 'warn']
      })
    ],
    tracesSampleRate: 0.1,
    beforeSend(event) {
      const values = event.exception?.values || []
      const stack = values.flatMap((value) => value.stacktrace?.frames || [])
      const fromBrowserExtension = stack.some((frame) =>
        String(frame.filename || '').startsWith('chrome-extension://') ||
        String(frame.filename || '').startsWith('moz-extension://') ||
        String(frame.filename || '').includes('/toolbar.js')
      )

      if (fromBrowserExtension) return null

      if (event.request?.headers) {
        delete event.request.headers.Authorization
        delete event.request.headers.authorization
      }
      return event
    }
  })
})
