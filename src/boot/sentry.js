import { boot } from 'quasar/wrappers'
import * as Sentry from '@sentry/vue'

const SENTRY_DSN = 'https://351b6d876cf90d23378810fff59718f9@o4511888096493568.ingest.us.sentry.io/4512284726067200'

export default boot(({ app, router, ssrContext }) => {
  if (typeof window === 'undefined') {
    const previousHandler = app.config.errorHandler
    app.config.errorHandler = (error, instance, info) => {
      ssrContext?.req?.captureSentryException?.(error)
      if (previousHandler) previousHandler(error, instance, info)
      else console.error(error)
    }
    return
  }

  Sentry.init({
    app,
    dsn: SENTRY_DSN,
    environment: process.env.DEV ? 'development' : 'production',
    enabled: !process.env.DEV,
    release: process.env.SENTRY_RELEASE,
    sendDefaultPii: false,
    integrations: [
      Sentry.browserTracingIntegration({ router }),
      Sentry.captureConsoleIntegration({
        levels: ['error']
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
        delete event.request.headers
      }
      if (event.request) {
        delete event.request.data
        delete event.request.cookies
        delete event.request.query_string
        if (event.request.url) event.request.url = event.request.url.split(/[?#]/)[0]
      }
      return event
    }
  })
})
