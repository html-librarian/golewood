import type { LoginResult } from '#shared/types/two-factor'
import { isMfaChallenge } from '#shared/types/two-factor'
import type { AuthSession } from '#shared/types/user'
import { isDevRuntime } from '#shared/utils/runtime-mode'

export type OAuthLoginResolution =
  | { kind: 'mfa', redirectPath: string }
  | { kind: 'session', session: AuthSession, redirectPath: string }

export const resolveOAuthLoginResult = (result: LoginResult): OAuthLoginResolution => {
  if (isMfaChallenge(result)) {
    const params = new URLSearchParams({
      mfa: '1',
      challenge: result.challengeToken,
      masked: result.maskedEmail,
    })

    if (isDevRuntime() && result.devCode) {
      params.set('devCode', result.devCode)
    }

    return {
      kind: 'mfa',
      redirectPath: `/auth/login?${params.toString()}`,
    }
  }

  return {
    kind: 'session',
    session: result,
    redirectPath: '/',
  }
}
