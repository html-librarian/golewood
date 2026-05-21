import type { GoogleCalendarConnectionStatus, GoogleCalendarOption } from '#shared/types/google-calendar'
import type { IcalEvent } from '#shared/utils/ical'
import { formatDate } from '#shared/utils/dates'
import { eq } from 'drizzle-orm'
import { hostGoogleCalendarCredentials } from '../db/schema'
import { getDb } from '../utils/db'
import { forbidInProduction } from '../utils/dev-guards'
import { SignJWT, jwtVerify } from 'jose'
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3'
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly']
const STATE_TTL = '15m'

type OAuthStatePayload = {
  sub: string
  listingId: string
  purpose: 'google-calendar'
}

const signOAuthState = async (payload: OAuthStatePayload) => {
  const secret = new TextEncoder().encode(useRuntimeConfig().jwtSecret)
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(STATE_TTL)
    .sign(secret)
}

const getConfig = () => {
  const config = useRuntimeConfig()

  return {
    clientId: (config.oauthGoogleClientId as string)?.trim() ?? '',
    clientSecret: (config.oauthGoogleClientSecret as string)?.trim() ?? '',
    siteUrl: (config.public.siteUrl as string)?.replace(/\/$/, '') ?? 'http://localhost:3000',
  }
}

const callbackUrl = () => `${getConfig().siteUrl}/api/host/google-calendar/callback`

export const googleCalendarService = {
  isConfigured: () => {
    const { clientId, clientSecret } = getConfig()
    return Boolean(clientId && clientSecret)
  },

  getConnectionStatus: async (userId: string): Promise<GoogleCalendarConnectionStatus> => {
    const db = getDb()
    const [row] = await db.select({
      googleEmail: hostGoogleCalendarCredentials.googleEmail,
    })
      .from(hostGoogleCalendarCredentials)
      .where(eq(hostGoogleCalendarCredentials.userId, userId))
      .limit(1)

    return {
      connected: Boolean(row),
      googleEmail: row?.googleEmail ?? null,
      configured: googleCalendarService.isConfigured(),
    }
  },

  parseConnectState: async (state: string) => {
    const secret = new TextEncoder().encode(useRuntimeConfig().jwtSecret)
    const { payload } = await jwtVerify<OAuthStatePayload>(state, secret).catch(() => ({
      payload: null,
    }))

    if (!payload?.sub || !payload.listingId || payload.purpose !== 'google-calendar') {
      throw createError({ statusCode: 400, statusMessage: 'Invalid OAuth state' })
    }

    return { userId: payload.sub, listingId: payload.listingId }
  },

  getConnectUrl: async (userId: string, listingId: string) => {
    if (!googleCalendarService.isConfigured()) {
      throw createError({ statusCode: 503, statusMessage: 'Google Calendar OAuth is not configured' })
    }

    const { clientId } = getConfig()
    const state = await signOAuthState({ sub: userId, listingId, purpose: 'google-calendar' })

    const url = new URL(GOOGLE_AUTH_URL)
    url.searchParams.set('client_id', clientId)
    url.searchParams.set('redirect_uri', callbackUrl())
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('scope', SCOPES.join(' '))
    url.searchParams.set('access_type', 'offline')
    url.searchParams.set('prompt', 'consent')
    url.searchParams.set('state', state)

    return url.toString()
  },

  mockConnect: async (userId: string) => {
    forbidInProduction()

    const db = getDb()

    await db.insert(hostGoogleCalendarCredentials).values({
      userId,
      refreshToken: 'mock-refresh-token',
      googleEmail: 'mock@gmail.com',
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: hostGoogleCalendarCredentials.userId,
      set: {
        refreshToken: 'mock-refresh-token',
        googleEmail: 'mock@gmail.com',
        updatedAt: new Date(),
      },
    })
  },

  handleCallback: async (code: string, state: string) => {
    const { userId, listingId } = await googleCalendarService.parseConnectState(state)
    const { clientId, clientSecret, siteUrl } = getConfig()

    const body = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: callbackUrl(),
      grant_type: 'authorization_code',
    })

    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })

    const tokenData = await tokenResponse.json() as {
      refresh_token?: string
      access_token?: string
      error?: string
    }

    if (!tokenResponse.ok || !tokenData.refresh_token) {
      throw createError({
        statusCode: 502,
        statusMessage: tokenData.error ?? 'Google OAuth token exchange failed',
      })
    }

    let googleEmail: string | null = null

    if (tokenData.access_token) {
      const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      })

      if (profileResponse.ok) {
        const profile = await profileResponse.json() as { email?: string }
        googleEmail = profile.email ?? null
      }
    }

    const db = getDb()

    await db.insert(hostGoogleCalendarCredentials).values({
      userId,
      refreshToken: tokenData.refresh_token,
      googleEmail,
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: hostGoogleCalendarCredentials.userId,
      set: {
        refreshToken: tokenData.refresh_token,
        googleEmail,
        updatedAt: new Date(),
      },
    })

    return {
      listingId,
      redirectUrl: `${siteUrl}/host/listings/${listingId}/calendar?google=connected`,
    }
  },

  disconnect: async (userId: string) => {
    const db = getDb()
    await db.delete(hostGoogleCalendarCredentials)
      .where(eq(hostGoogleCalendarCredentials.userId, userId))
  },

  getAccessToken: async (userId: string) => {
    const db = getDb()
    const [row] = await db.select()
      .from(hostGoogleCalendarCredentials)
      .where(eq(hostGoogleCalendarCredentials.userId, userId))
      .limit(1)

    if (!row) {
      throw createError({ statusCode: 400, statusMessage: 'Google Calendar is not connected' })
    }

    if (row.refreshToken === 'mock-refresh-token') {
      return 'mock-access-token'
    }

    const { clientId, clientSecret } = getConfig()
    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: row.refreshToken,
      grant_type: 'refresh_token',
    })

    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })

    const data = await response.json() as { access_token?: string, error?: string }

    if (!response.ok || !data.access_token) {
      throw createError({ statusCode: 502, statusMessage: data.error ?? 'Google token refresh failed' })
    }

    return data.access_token
  },

  listCalendars: async (userId: string): Promise<GoogleCalendarOption[]> => {
    const accessToken = await googleCalendarService.getAccessToken(userId)

    if (accessToken === 'mock-access-token') {
      return [
        { id: 'mock-primary', summary: 'Mock calendar (dev)', primary: true },
        { id: 'mock-busy', summary: 'Mock busy calendar (dev)', primary: false },
      ]
    }

    const response = await fetch(`${GOOGLE_CALENDAR_API}/users/me/calendarList`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    const data = await response.json() as {
      items?: Array<{ id: string, summary?: string, primary?: boolean }>
      error?: { message?: string }
    }

    if (!response.ok) {
      throw createError({
        statusCode: 502,
        statusMessage: data.error?.message ?? 'Failed to list Google calendars',
      })
    }

    return (data.items ?? []).map(item => ({
      id: item.id,
      summary: item.summary ?? item.id,
      primary: Boolean(item.primary),
    }))
  },

  fetchEvents: async (userId: string, calendarId: string): Promise<IcalEvent[]> => {
    const accessToken = await googleCalendarService.getAccessToken(userId)

    if (accessToken === 'mock-access-token') {
      const start = formatDate(new Date())
      const endDate = new Date()
      endDate.setUTCDate(endDate.getUTCDate() + 14)
      return [{
        uid: `mock-${calendarId}-1`,
        startDate: start,
        endDate: formatDate(endDate),
      }]
    }

    const timeMin = new Date()
    timeMin.setUTCMonth(timeMin.getUTCMonth() - 1)
    const timeMax = new Date()
    timeMax.setUTCMonth(timeMax.getUTCMonth() + 18)

    const url = new URL(`${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events`)
    url.searchParams.set('singleEvents', 'true')
    url.searchParams.set('orderBy', 'startTime')
    url.searchParams.set('timeMin', timeMin.toISOString())
    url.searchParams.set('timeMax', timeMax.toISOString())
    url.searchParams.set('maxResults', '2500')

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    const data = await response.json() as {
      items?: Array<{
        id: string
        status?: string
        start?: { date?: string, dateTime?: string }
        end?: { date?: string, dateTime?: string }
      }>
      error?: { message?: string }
    }

    if (!response.ok) {
      throw createError({
        statusCode: 502,
        statusMessage: data.error?.message ?? 'Failed to fetch Google Calendar events',
      })
    }

    const events: IcalEvent[] = []

    for (const item of data.items ?? []) {
      if (item.status === 'cancelled') {
        continue
      }

      const startDate = item.start?.date ?? item.start?.dateTime?.slice(0, 10)
      const endDate = item.end?.date ?? item.end?.dateTime?.slice(0, 10)

      if (!startDate || !endDate || endDate <= startDate) {
        continue
      }

      events.push({
        uid: item.id,
        startDate,
        endDate,
      })
    }

    return events
  },
}
