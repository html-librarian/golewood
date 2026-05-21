export default defineEventHandler((event) => {
  if (!event.path.startsWith('/api/')) {
    return
  }

  const config = useRuntimeConfig()
  const allowedOrigin = config.corsOrigin || config.public.siteUrl
  const origin = getHeader(event, 'origin')

  if (origin && (allowedOrigin === '*' || origin === allowedOrigin)) {
    setHeader(event, 'Access-Control-Allow-Origin', origin)
    setHeader(event, 'Access-Control-Allow-Credentials', 'true')
    setHeader(event, 'Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS')
    setHeader(event, 'Access-Control-Allow-Headers', 'Authorization,Content-Type,Idempotency-Key')
    setHeader(event, 'Vary', 'Origin')
  }

  if (event.method === 'OPTIONS') {
    setResponseStatus(event, 204)
    return null
  }
})
