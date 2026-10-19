import * as Sentry from '@sentry/node'
import { ssrMiddleware } from 'quasar/wrappers'

Sentry.init({
  dsn: 'https://351b6d876cf90d23378810fff59718f9@o4511888096493568.ingest.us.sentry.io/4512284726067200',
  environment: process.env.NODE_ENV || 'production',
  release: process.env.SENTRY_RELEASE || 'poliweb-web@2026.10.19',
  tracesSampleRate: 0,
  sendDefaultPii: false,
  beforeSend(event) {
    if (event.request) {
      delete event.request.headers
      delete event.request.data
      delete event.request.cookies
      delete event.request.query_string
      if (event.request.url) event.request.url = event.request.url.split(/[?#]/)[0]
    }
    return event
  }
})

export default ssrMiddleware(({ app }) => {
  app.use((req, res, next) => {
    req.captureSentryException = (error) => {
      Sentry.withScope((scope) => {
        scope.setTag('poliweb.component', 'ssr')
        scope.setContext('http', { method: req.method, path: req.path })
        Sentry.captureException(error)
      })
    }
    next()
  })
})
