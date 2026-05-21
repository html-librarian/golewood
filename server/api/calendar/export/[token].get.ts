import { calendarSyncService } from '../../../services/calendar-sync.service'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')?.replace(/\.ics$/i, '')

  if (!token) {
    throw createError({ statusCode: 400, statusMessage: 'Missing calendar token' })
  }

  const body = await calendarSyncService.exportByToken(token)

  setHeader(event, 'content-type', 'text/calendar; charset=utf-8')
  setHeader(event, 'cache-control', 'private, max-age=300')

  return body
})
