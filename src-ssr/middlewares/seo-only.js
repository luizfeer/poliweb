import { ssrMiddleware } from 'quasar/wrappers'

const ASSET_PATHS = [
  '/favicon',
  '/icons/',
  '/statics/',
  '/css/',
  '/js/',
  '/fonts/',
  '/img/'
]

const ASSET_EXTENSIONS = /\.(?:css|js|mjs|map|json|txt|xml|png|jpe?g|gif|svg|webp|ico|woff2?|ttf|eot)$/i

export default ssrMiddleware(({ app }) => {
  app.get('*', (req, res, next) => {
    const routePrefixes = (process.env.SSR_ONLY_ROUTE_PREFIX || '/comercio')
      .split(',')
      .map((prefix) => prefix.trim())
      .filter(Boolean)
    const fallbackBaseUrl = (process.env.SSR_FALLBACK_URL || 'https://www.poliwebapp.com.br').replace(/\/$/, '')
    const requestPath = req.path || req.url || '/'
    const acceptsHtml = (req.headers.accept || '').includes('text/html')
    const isAssetPath = ASSET_PATHS.some((prefix) => requestPath.startsWith(prefix)) || ASSET_EXTENSIONS.test(requestPath)
    const isCityCategoryPath = /^\/[a-z0-9-]+\/[a-z0-9-]+\/?$/i.test(requestPath)
    const isCityPath = /^\/[a-z0-9-]+\/?$/i.test(requestPath)

    if (
      req.method !== 'GET' ||
      !acceptsHtml ||
      isAssetPath ||
      isCityPath ||
      isCityCategoryPath ||
      routePrefixes.some((prefix) => requestPath.startsWith(prefix))
    ) {
      next()
      return
    }

    res.redirect(302, `${fallbackBaseUrl}${req.originalUrl || requestPath}`)
  })
})
