import { mfaChallengeSchema } from '#shared/schemas/auth'
import { twoFactorService } from '../../services/two-factor.service'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { challengeToken } = mfaChallengeSchema.parse(body)

  return await twoFactorService.resendLoginChallenge(challengeToken)
})
