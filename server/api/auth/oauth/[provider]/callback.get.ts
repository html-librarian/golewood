import type { OAuthProvider } from '#shared/types/oauth'
import { oauthService } from '../../../../services/oauth.service'
import { resolveOAuthLoginResult } from '../../../../utils/oauth-login'
import { getSessionClientMeta } from '../../../../utils/session-client-meta'

const parseProvider = (value: string | undefined): OAuthProvider => {
  if (value === 'yandex' || value === 'vk') {
    return value
  }

  throw createError({ statusCode: 400, statusMessage: 'Unsupported OAuth provider' })
}

const setSessionCookies = (
  event: Parameters<typeof defineEventHandler>[0] extends (e: infer E) => unknown ? E : never,
  session: { accessToken: string, refreshToken: string, sessionId: string },
) => {
  setCookie(event, 'auth-access-token', session.accessToken, {
    sameSite: 'lax',
    path: '/',
    httpOnly: false,
  })
  setCookie(event, 'auth-refresh-token', session.refreshToken, {
    sameSite: 'lax',
    path: '/',
    httpOnly: false,
  })
  setCookie(event, 'auth-session-id', session.sessionId, {
    sameSite: 'lax',
    path: '/',
    httpOnly: false,
  })
}

export default defineEventHandler(async (event) => {
  const localePath = useLocalePath()
  const provider = parseProvider(getRouterParam(event, 'provider'))
  const meta = getSessionClientMeta(event)

  try {
    const result = provider === 'vk'
      ? await oauthService.handleVkCallback(event, meta)
      : await (async () => {
        const code = getQuery(event).code

        if (!code || typeof code !== 'string') {
          throw createError({ statusCode: 400, statusMessage: 'Missing OAuth code' })
        }

        return oauthService.handleCallback(provider, code, meta)
      })()
    const resolved = resolveOAuthLoginResult(result)

    if (resolved.kind === 'mfa') {
      return sendRedirect(event, resolved.redirectPath)
    }

    setSessionCookies(event, resolved.session)
    return sendRedirect(event, resolved.redirectPath)
  } catch (err: unknown) {
    const status = err && typeof err === 'object' && 'statusCode' in err
      ? Number((err as { statusCode: number }).statusCode)
      : 500

    const message = err && typeof err === 'object' && 'statusMessage' in err
      ? String((err as { statusMessage: string }).statusMessage)
      : 'oauth_failed'

    if (status >= 400 && status < 500) {
      return sendRedirect(event, localePath({
        path: '/auth/login',
        query: { oauth: provider, error: message },
      }))
    }

    console.error(`[oauth] ${provider} callback failed (${status}):`, message, err)

    return sendRedirect(event, localePath({
      path: '/auth/login',
      query: { oauth: provider, error: 'oauth_failed' },
    }))
  }
})
