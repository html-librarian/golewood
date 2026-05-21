import type { OAuthProvider } from '#shared/types/oauth'
import { oauthService } from '../../../services/oauth.service'

const parseProvider = (value: string | undefined): OAuthProvider => {
  if (value === 'yandex' || value === 'vk') {
    return value
  }

  throw createError({ statusCode: 400, statusMessage: 'Unsupported OAuth provider' })
}

export default defineEventHandler((event) => {
  const provider = parseProvider(getRouterParam(event, 'provider'))
  const url = oauthService.getAuthorizeUrl(provider)
  return sendRedirect(event, url)
})
