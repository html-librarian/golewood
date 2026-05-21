import type { MaxBridgeAuthResult } from '#shared/types/max-bridge'
import type { User } from '#shared/types/user'
import { validateMaxInitData, parseMaxInitData, isMaxInitDataFresh } from '#shared/utils/max-init-data'
import { eq } from 'drizzle-orm'
import { users } from '../db/schema'
import { mapUser, requireAuth } from '../utils/auth'
import { getDb } from '../utils/db'
import { authService } from './auth.service'
import { forbidInProduction } from '../utils/dev-guards'
import type { H3Event } from 'h3'

const MINI_APP_ROLES: User['role'][] = ['guest', 'host', 'admin', 'support', 'content_manager']

const getBridgeConfig = () => {
  const config = useRuntimeConfig()

  return {
    botToken: (config.maxBotToken as string)?.trim() ?? '',
    botUsername: (config.public.maxBotUsername as string)?.trim() ?? '',
    siteUrl: (config.public.siteUrl as string)?.replace(/\/$/, '') ?? '',
  }
}

const parseInitDataOrThrow = (initData: string, botToken: string) => {
  if (!validateMaxInitData(initData, botToken)) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid MAX initData' })
  }

  const parsed = parseMaxInitData(initData)

  if (!parsed) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid MAX initData' })
  }

  if (!isMaxInitDataFresh(parsed.authDate)) {
    throw createError({ statusCode: 401, statusMessage: 'MAX initData expired' })
  }

  return parsed
}

const findUserByMaxId = async (maxUserId: number) => {
  const db = getDb()
  const [row] = await db.select().from(users).where(eq(users.maxUserId, maxUserId)).limit(1)

  return row ?? null
}

const linkMaxToUser = async (userId: string, maxUserId: number) => {
  const db = getDb()
  const [existing] = await db.select({ id: users.id })
    .from(users)
    .where(eq(users.maxUserId, maxUserId))
    .limit(1)

  if (existing && existing.id !== userId) {
    throw createError({ statusCode: 409, statusMessage: 'MAX account already linked to another user' })
  }

  await db.update(users)
    .set({
      maxUserId,
      maxLinkedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
}

export const maxBridgeService = {
  authenticate: async (initData: string): Promise<MaxBridgeAuthResult> => {
    const { botToken, botUsername, siteUrl } = getBridgeConfig()

    if (!botToken) {
      throw createError({ statusCode: 503, statusMessage: 'MAX bot is not configured' })
    }

    const parsed = parseInitDataOrThrow(initData, botToken)
    const row = await findUserByMaxId(parsed.maxUserId)

    if (!row) {
      return {
        needsLink: true,
        maxUserId: parsed.maxUserId,
        startParam: parsed.startParam,
        botUsername: botUsername || null,
        accountUrl: siteUrl ? `${siteUrl}/account` : '/account',
      }
    }

    if (!MINI_APP_ROLES.includes(row.role as User['role'])) {
      throw createError({
        statusCode: 403,
        statusMessage: 'MAX mini-app is not available for this account',
      })
    }

    const tokens = await authService.issueTokens(row)

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      sessionId: tokens.sessionId,
      user: mapUser(row),
    }
  },

  linkForCurrentUser: async (event: H3Event, initData: string) => {
    const user = requireAuth(event)

    if (!MINI_APP_ROLES.includes(user.role)) {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    const { botToken } = getBridgeConfig()

    if (!botToken) {
      throw createError({ statusCode: 503, statusMessage: 'MAX bot is not configured' })
    }

    const parsed = parseInitDataOrThrow(initData, botToken)
    await linkMaxToUser(user.id, parsed.maxUserId)

    return {
      linked: true as const,
      maxUserId: parsed.maxUserId,
    }
  },

  /** Dev-only: sign in as user linked to maxUserId without Bridge client. */
  mockAuthenticate: async (maxUserId: number): Promise<MaxBridgeAuthResult> => {
    forbidInProduction()

    const row = await findUserByMaxId(maxUserId)

    if (!row) {
      throw createError({
        statusCode: 404,
        statusMessage: 'No Golewood user linked to this MAX id. Use mock-link in /account first.',
      })
    }

    if (!MINI_APP_ROLES.includes(row.role as User['role'])) {
      throw createError({ statusCode: 403, statusMessage: 'Account role not allowed in mini-app' })
    }

    const tokens = await authService.issueTokens(row)

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      sessionId: tokens.sessionId,
      user: mapUser(row),
    }
  },
}
