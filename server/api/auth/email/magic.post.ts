import { emailMagicSchema } from '#shared/schemas/auth'
import { authService } from '../../../services/auth.service'
import { accountEmailService } from '../../../services/account-email.service'
import { verifyEmailMagicToken } from '../../../utils/magic-link'
import { getSessionClientMeta } from '../../../utils/session-client-meta'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { token, linkPhone } = emailMagicSchema.parse(body)
  const payload = await verifyEmailMagicToken(token)

  if (payload.purpose === 'email-login') {
    return {
      type: 'login' as const,
      session: await authService.verifyEmailMagic(payload, { linkPhone }, getSessionClientMeta(event)),
    }
  }

  if (payload.purpose === 'account-email') {
    if (!payload.sub) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid magic link' })
    }

    return {
      type: 'account-email' as const,
      user: await accountEmailService.applyEmailMagic(payload.sub, payload.email),
    }
  }

  throw createError({ statusCode: 400, statusMessage: 'Invalid magic link' })
})
