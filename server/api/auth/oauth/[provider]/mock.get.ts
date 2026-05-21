import type { OAuthProvider } from '#shared/types/oauth'
import { oauthService } from '../../../../services/oauth.service'
import { forbidInProduction } from '../../../../utils/dev-guards'
import { resolveOAuthLoginResult } from '../../../../utils/oauth-login'
import { getSessionClientMeta } from '../../../../utils/session-client-meta'

const parseProvider = (value: string | undefined): OAuthProvider => {
  if (value === 'yandex' || value === 'vk') {
    return value
  }

  throw createError({ statusCode: 400, statusMessage: 'Unsupported OAuth provider' })
}

export default defineEventHandler(async (event) => {
  forbidInProduction()

  const provider = parseProvider(getRouterParam(event, 'provider'))

  if (oauthService.isConfigured(provider)) {
    throw createError({ statusCode: 400, statusMessage: 'OAuth provider is configured; use real flow' })
  }

  const result = await oauthService.handleMock(provider, getSessionClientMeta(event))
  const resolved = resolveOAuthLoginResult(result)

  if (resolved.kind === 'mfa') {
    return sendRedirect(event, resolved.redirectPath)
  }

  setCookie(event, 'auth-access-token', resolved.session.accessToken, {
    sameSite: 'lax',
    path: '/',
    httpOnly: false,
  })
  setCookie(event, 'auth-refresh-token', resolved.session.refreshToken, {
    sameSite: 'lax',
    path: '/',
    httpOnly: false,
  })
  setCookie(event, 'auth-session-id', resolved.session.sessionId, {
    sameSite: 'lax',
    path: '/',
    httpOnly: false,
  })

  return sendRedirect(event, resolved.redirectPath)
})
