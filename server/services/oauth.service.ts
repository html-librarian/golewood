import type { OAuthProfile, OAuthProvider } from '#shared/types/oauth'
import type { SessionClientMeta } from '#shared/types/session'
import type { LoginResult } from '#shared/types/two-factor'
import { and, eq } from 'drizzle-orm'
import { normalizeEmail } from '#shared/utils/email'
import { oauthAccounts, users } from '../db/schema'
import { getDb } from '../utils/db'
import { userNamePartsFromWestern } from '#shared/utils/user-name'
import { authService } from './auth.service'
import { resolveAuthNameColumns } from './auth-name'
import { toUserNameDbColumns } from '../utils/user-name'
import { syntheticOAuthPhone } from '#shared/utils/synthetic-phone-oauth'
import { forbidInProduction } from '../utils/dev-guards'

const getOAuthConfig = () => {
  const config = useRuntimeConfig()
  return {
    siteUrl: config.public.siteUrl as string,
    yandexClientId: config.oauthYandexClientId as string,
    yandexClientSecret: config.oauthYandexClientSecret as string,
    vkClientId: config.oauthVkClientId as string,
    vkClientSecret: config.oauthVkClientSecret as string,
  }
}

const callbackUrl = (provider: OAuthProvider) => {
  const { siteUrl } = getOAuthConfig()
  return `${siteUrl.replace(/\/$/, '')}/api/auth/oauth/${provider}/callback`
}

const isProviderConfigured = (provider: OAuthProvider) => {
  const config = getOAuthConfig()

  if (provider === 'yandex') {
    return Boolean(config.yandexClientId && config.yandexClientSecret)
  }

  return Boolean(config.vkClientId && config.vkClientSecret)
}

const fetchYandexProfile = async (code: string): Promise<OAuthProfile> => {
  const config = getOAuthConfig()
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: config.yandexClientId,
    client_secret: config.yandexClientSecret,
  })

  const tokenResponse = await fetch('https://oauth.yandex.ru/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  const tokenData = await tokenResponse.json()

  if (!tokenResponse.ok || !tokenData.access_token) {
    throw createError({ statusCode: 502, statusMessage: 'Yandex OAuth failed' })
  }

  const profileResponse = await fetch('https://login.yandex.ru/info?format=json', {
    headers: { Authorization: `OAuth ${tokenData.access_token}` },
  })

  const profile = await profileResponse.json()

  return {
    providerUserId: String(profile.id),
    name: profile.real_name ?? profile.display_name ?? null,
    email: profile.default_email ?? null,
  }
}

const fetchVkProfile = async (code: string): Promise<OAuthProfile> => {
  const config = getOAuthConfig()
  const redirectUri = callbackUrl('vk')
  const tokenUrl = new URL('https://oauth.vk.com/access_token')
  tokenUrl.searchParams.set('client_id', config.vkClientId)
  tokenUrl.searchParams.set('client_secret', config.vkClientSecret)
  tokenUrl.searchParams.set('redirect_uri', redirectUri)
  tokenUrl.searchParams.set('code', code)

  const tokenResponse = await fetch(tokenUrl)
  const tokenData = await tokenResponse.json()

  if (!tokenResponse.ok || !tokenData.user_id) {
    throw createError({ statusCode: 502, statusMessage: 'VK OAuth failed' })
  }

  const userUrl = new URL('https://api.vk.com/method/users.get')
  userUrl.searchParams.set('user_ids', String(tokenData.user_id))
  userUrl.searchParams.set('fields', 'screen_name')
  userUrl.searchParams.set('access_token', tokenData.access_token)
  userUrl.searchParams.set('v', '5.199')

  const profileResponse = await fetch(userUrl)
  const profileData = await profileResponse.json()
  const profile = profileData.response?.[0]

  return {
    providerUserId: String(tokenData.user_id),
    name: profile ? `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() : null,
    firstName: profile?.first_name ?? null,
    lastName: profile?.last_name ?? null,
    email: tokenData.email ?? null,
  }
}

const oauthProfileNameColumns = (profile: OAuthProfile) => {
  if (profile.lastName?.trim() && profile.firstName?.trim()) {
    return toUserNameDbColumns(userNamePartsFromWestern(profile.firstName, profile.lastName))
  }

  return profile.name ? resolveAuthNameColumns({ name: profile.name }) : null
}

const mergeOAuthProfile = async (
  userRow: typeof users.$inferSelect,
  profile: OAuthProfile,
): Promise<typeof users.$inferSelect> => {
  const updates: Partial<typeof users.$inferInsert> = {}
  let hasUpdates = false

  if (profile.email && !userRow.email) {
    updates.email = normalizeEmail(profile.email)
    hasUpdates = true
  }

  if (!userRow.lastName && !userRow.name) {
    const nameCols = oauthProfileNameColumns(profile)

    if (nameCols) {
      Object.assign(updates, nameCols)
      hasUpdates = true
    }
  }

  if (!hasUpdates) {
    return userRow
  }

  updates.updatedAt = new Date()

  const db = getDb()
  const [updated] = await db.update(users)
    .set(updates)
    .where(eq(users.id, userRow.id))
    .returning()

  return updated ?? userRow
}

const findOrCreateUser = async (provider: OAuthProvider, profile: OAuthProfile) => {
  const db = getDb()
  const [linked] = await db.select({ user: users })
    .from(oauthAccounts)
    .innerJoin(users, eq(oauthAccounts.userId, users.id))
    .where(and(
      eq(oauthAccounts.provider, provider),
      eq(oauthAccounts.providerUserId, profile.providerUserId),
    ))
    .limit(1)

  if (linked) {
    return mergeOAuthProfile(linked.user, profile)
  }

  let phone = syntheticOAuthPhone(provider, profile.providerUserId)
  let attempts = 0

  while (attempts < 5) {
    const [existingPhone] = await db.select().from(users).where(eq(users.phone, phone)).limit(1)

    if (!existingPhone) {
      break
    }

    phone = syntheticOAuthPhone(provider, `${profile.providerUserId}-${attempts}`)
    attempts++
  }

  const nameCols = oauthProfileNameColumns(profile) ?? {
    name: profile.name,
    lastName: null,
    firstName: null,
    patronymic: null,
  }

  const [userRow] = await db.insert(users).values({
    phone,
    email: profile.email ? normalizeEmail(profile.email) : null,
    ...nameCols,
    role: 'guest',
  }).returning()

  await db.insert(oauthAccounts).values({
    userId: userRow.id,
    provider,
    providerUserId: profile.providerUserId,
    profileName: profile.name,
  })

  return userRow
}

export const oauthService = {
  isConfigured: isProviderConfigured,

  getAuthorizeUrl: (provider: OAuthProvider) => {
    if (!isProviderConfigured(provider)) {
      forbidInProduction()
      return `/api/auth/oauth/${provider}/mock`
    }

    const redirectUri = encodeURIComponent(callbackUrl(provider))

    if (provider === 'yandex') {
      const { yandexClientId } = getOAuthConfig()
      return `https://oauth.yandex.ru/authorize?response_type=code&client_id=${yandexClientId}&redirect_uri=${redirectUri}`
    }

    const { vkClientId } = getOAuthConfig()
    return `https://oauth.vk.com/authorize?client_id=${vkClientId}&redirect_uri=${redirectUri}&response_type=code&scope=email&v=5.199`
  },

  handleCallback: async (
    provider: OAuthProvider,
    code: string,
    meta?: SessionClientMeta,
  ): Promise<LoginResult> => {
    const profile = provider === 'yandex'
      ? await fetchYandexProfile(code)
      : await fetchVkProfile(code)

    const userRow = await findOrCreateUser(provider, profile)
    return authService.completeLogin(userRow, meta)
  },

  handleMock: async (
    provider: OAuthProvider,
    meta?: SessionClientMeta,
  ): Promise<LoginResult> => {
    forbidInProduction()

    const profile: OAuthProfile = {
      providerUserId: `mock-${provider}`,
      name: `${provider} User (dev)`,
      email: null,
    }

    const userRow = await findOrCreateUser(provider, profile)
    return authService.completeLogin(userRow, meta)
  },
}
