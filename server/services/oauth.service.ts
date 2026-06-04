import type { H3Event } from 'h3'
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
import {
  buildVkCodeChallenge,
  generateVkCodeVerifier,
  generateVkOAuthState,
  parseVkIdCallbackQuery,
} from '../utils/vk-id-oauth'
import { consumeVkOAuthVerifier, storeVkOAuthVerifier } from '../utils/vk-oauth-state'

const VK_OAUTH_STATE_COOKIE = 'vk-oauth-state'
const VK_OAUTH_VERIFIER_COOKIE = 'vk-oauth-verifier'
const VK_OAUTH_COOKIE_MAX_AGE = 600

const vkOAuthCookieOptions = () => ({
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: VK_OAUTH_COOKIE_MAX_AGE,
  secure: process.env.NODE_ENV === 'production',
})

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

const fetchVkIdProfile = async (
  code: string,
  codeVerifier: string,
  deviceId: string,
  state: string,
): Promise<OAuthProfile> => {
  const config = getOAuthConfig()
  const redirectUri = callbackUrl('vk')

  const tokenBody = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    code_verifier: codeVerifier,
    client_id: config.vkClientId,
    redirect_uri: redirectUri,
    device_id: deviceId,
    state,
  })

  // Web (public) app: PKCE + «Защищённый ключ» as client_secret. service_token is only for confidential apps.
  if (config.vkClientSecret) {
    tokenBody.set('client_secret', config.vkClientSecret)
  }

  const tokenResponse = await fetch('https://id.vk.ru/oauth2/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: tokenBody,
  })

  const tokenData = await tokenResponse.json() as {
    access_token?: string
    user_id?: number | string
    error?: string
    error_description?: string
  }

  if (!tokenResponse.ok || !tokenData.access_token) {
    throw createError({
      statusCode: 502,
      statusMessage: tokenData.error_description ?? tokenData.error ?? 'VK ID token exchange failed',
    })
  }

  const userBody = new URLSearchParams({
    access_token: tokenData.access_token,
    client_id: config.vkClientId,
  })

  const profileResponse = await fetch('https://id.vk.ru/oauth2/user_info', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: userBody,
  })

  const profileData = await profileResponse.json() as {
    user?: {
      user_id?: string | number
      first_name?: string
      last_name?: string
      email?: string
    }
    error?: string
    error_description?: string
  }

  const user = profileData.user

  if (!profileResponse.ok || !user?.user_id) {
    throw createError({
      statusCode: 502,
      statusMessage: profileData.error_description ?? profileData.error ?? 'VK ID user_info failed',
    })
  }

  const firstName = user.first_name ?? null
  const lastName = user.last_name ?? null

  return {
    providerUserId: String(user.user_id),
    name: firstName || lastName ? `${firstName ?? ''} ${lastName ?? ''}`.trim() : null,
    firstName,
    lastName,
    email: user.email ?? null,
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

    throw createError({
      statusCode: 500,
      statusMessage: 'Use prepareVkAuthorize for VK ID',
    })
  },

  prepareVkAuthorize: async (event: H3Event) => {
    if (!isProviderConfigured('vk')) {
      forbidInProduction()
      return `/api/auth/oauth/vk/mock`
    }

    const verifier = generateVkCodeVerifier()
    const challenge = buildVkCodeChallenge(verifier)
    const state = generateVkOAuthState()
    const { vkClientId } = getOAuthConfig()
    const redirectUri = callbackUrl('vk')
    const cookieOptions = vkOAuthCookieOptions()

    setCookie(event, VK_OAUTH_VERIFIER_COOKIE, verifier, cookieOptions)
    setCookie(event, VK_OAUTH_STATE_COOKIE, state, cookieOptions)
    await storeVkOAuthVerifier(state, verifier)

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: vkClientId,
      redirect_uri: redirectUri,
      state,
      code_challenge: challenge,
      code_challenge_method: 'S256',
      scope: 'vkid.personal_info email',
    })

    return `https://id.vk.ru/authorize?${params.toString()}`
  },

  handleVkCallback: async (
    event: H3Event,
    meta?: SessionClientMeta,
  ): Promise<LoginResult> => {
    const parsed = parseVkIdCallbackQuery(getQuery(event) as Record<string, unknown>)

    if (!parsed) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid VK ID callback' })
    }

    const savedState = getCookie(event, VK_OAUTH_STATE_COOKIE)
    const cookieVerifier = getCookie(event, VK_OAUTH_VERIFIER_COOKIE)
    const redisVerifier = await consumeVkOAuthVerifier(parsed.state)
    const verifier = redisVerifier ?? cookieVerifier

    if (!verifier || (savedState && savedState !== parsed.state)) {
      throw createError({ statusCode: 400, statusMessage: 'VK ID state mismatch' })
    }

    deleteCookie(event, VK_OAUTH_STATE_COOKIE, { path: '/' })
    deleteCookie(event, VK_OAUTH_VERIFIER_COOKIE, { path: '/' })

    const profile = await fetchVkIdProfile(
      parsed.code,
      verifier,
      parsed.deviceId,
      parsed.state,
    )

    const userRow = await findOrCreateUser('vk', profile)
    return authService.completeLogin(userRow, meta)
  },

  handleCallback: async (
    provider: OAuthProvider,
    code: string,
    meta?: SessionClientMeta,
  ): Promise<LoginResult> => {
    if (provider === 'vk') {
      throw createError({ statusCode: 400, statusMessage: 'Use handleVkCallback for VK ID' })
    }

    const profile = await fetchYandexProfile(code)
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
      name: null,
      firstName: provider === 'yandex' ? 'Yandex' : 'VK',
      lastName: 'Dev',
      email: null,
    }

    const userRow = await findOrCreateUser(provider, profile)
    return authService.completeLogin(userRow, meta)
  },
}
