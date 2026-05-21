import { createHmac } from 'node:crypto'
import type { MaxBridgeUser, MaxInitDataParsed } from '#shared/types/max-bridge'

const INIT_DATA_MAX_AGE_SEC = 3600

const splitInitDataPairs = (appData: string): string[][] =>
  appData.split('&').map((part) => {
    const eq = part.indexOf('=')

    if (eq === -1) {
      return [part, '']
    }

    return [part.slice(0, eq), part.slice(eq + 1)]
  })

const buildLaunchParams = (pairs: string[][]) => {
  const decoded = pairs.map(([key, value = '']) => [key, decodeURIComponent(value)] as const)
  decoded.sort((a, b) => (a[0] ?? '').localeCompare(b[0] ?? ''))

  return decoded
    .filter(([key]) => key !== 'hash')
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')
}

export const computeMaxInitDataHash = (launchParams: string, botToken: string) => {
  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest()
  return createHmac('sha256', secretKey).update(launchParams).digest('hex')
}

export const validateMaxInitData = (appData: string, botToken: string) => {
  if (!appData.trim() || !botToken.trim()) {
    return false
  }

  const pairs = splitInitDataPairs(appData)
  const hashEntries = pairs.filter(([key]) => key === 'hash')

  if (hashEntries.length !== 1) {
    return false
  }

  const receivedHash = hashEntries[0]?.[1]

  if (!receivedHash) {
    return false
  }

  const launchParams = buildLaunchParams(pairs)
  const expectedHash = computeMaxInitDataHash(launchParams, botToken)

  return expectedHash === decodeURIComponent(receivedHash)
}

export const isMaxInitDataFresh = (authDate: number, maxAgeSec = INIT_DATA_MAX_AGE_SEC) => {
  const now = Math.floor(Date.now() / 1000)
  return authDate > 0 && now - authDate <= maxAgeSec
}

export const parseMaxInitData = (appData: string): MaxInitDataParsed | null => {
  const pairs = splitInitDataPairs(appData)
  const fields = new Map<string, string>()

  for (const [key, value = ''] of pairs) {
    if (key === 'hash') {
      continue
    }

    fields.set(key, decodeURIComponent(value))
  }

  const userRaw = fields.get('user')

  if (!userRaw) {
    return null
  }

  let user: MaxBridgeUser

  try {
    user = JSON.parse(userRaw) as MaxBridgeUser
  } catch {
    return null
  }

  if (!user?.id || typeof user.id !== 'number') {
    return null
  }

  const authDate = Number(fields.get('auth_date') ?? 0)

  if (!Number.isFinite(authDate)) {
    return null
  }

  return {
    queryId: fields.get('query_id') ?? null,
    authDate,
    maxUserId: user.id,
    startParam: fields.get('start_param') ?? null,
    user,
  }
}

export const assertValidMaxInitData = (appData: string, botToken: string) => {
  if (!validateMaxInitData(appData, botToken)) {
    throw new Error('Invalid MAX initData signature')
  }

  const parsed = parseMaxInitData(appData)

  if (!parsed) {
    throw new Error('Invalid MAX initData payload')
  }

  if (!isMaxInitDataFresh(parsed.authDate)) {
    throw new Error('MAX initData expired')
  }

  return parsed
}
