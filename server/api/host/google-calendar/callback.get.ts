import { googleCalendarService } from '../../../services/google-calendar.service'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const code = typeof query.code === 'string' ? query.code : ''
  const state = typeof query.state === 'string' ? query.state : ''

  if (!code || !state) {
    throw createError({ statusCode: 400, statusMessage: 'Missing OAuth parameters' })
  }

  const { redirectUrl } = await googleCalendarService.handleCallback(code, state)
  return sendRedirect(event, redirectUrl)
})
