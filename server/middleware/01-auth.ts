import { resolveUserFromToken } from '../utils/auth'

export default defineEventHandler(async (event) => {
  const authorization = getHeader(event, 'authorization')

  if (!authorization?.startsWith('Bearer ')) {
    return
  }

  const token = authorization.slice(7)
  const user = await resolveUserFromToken(token).catch(() => null)

  if (user) {
    event.context.auth = { user }
  }
})
