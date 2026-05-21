import type { H3Event } from 'h3'
import { sessionMetaFromUserAgent } from '#shared/utils/session-client'
import type { SessionClientMeta } from '#shared/types/session'

export const getSessionClientMeta = (event?: H3Event): SessionClientMeta =>
  sessionMetaFromUserAgent(event ? getRequestHeader(event, 'user-agent') : undefined)
