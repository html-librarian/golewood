import { z } from 'zod'
import { normalizeEmail } from '#shared/utils/email'
import { userNamePartsSchema } from './user-name'

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+7\d{10}$/, 'Invalid phone format')

export const emailSchema = z
  .string()
  .trim()
  .email()
  .max(255)
  .transform(normalizeEmail)

export const sendCodeSchema = z.object({
  phone: phoneSchema,
})

export const verifyCodeSchema = z.object({
  phone: phoneSchema,
  code: z.string().trim().length(4),
}).merge(userNamePartsSchema.partial())

export const sendEmailCodeSchema = z.object({
  email: emailSchema,
})

export const verifyEmailCodeSchema = z.object({
  email: emailSchema,
  code: z.string().trim().length(4),
  /** Real mobile for new email registration. */
  phone: phoneSchema.optional(),
  /** Merge email login with an existing phone account that has no email yet. */
  linkPhone: phoneSchema.optional(),
}).merge(userNamePartsSchema.partial())

export const emailMagicSchema = z.object({
  token: z.string().trim().min(10),
  linkPhone: phoneSchema.optional(),
})

export const changePhoneSendSchema = z.object({
  phone: phoneSchema,
})

export const changePhoneVerifySchema = z.object({
  phone: phoneSchema,
  code: z.string().trim().length(4),
})

export const changePhoneOldVerifySchema = z.object({
  code: z.string().trim().length(4),
})

export const refreshTokenSchema = z.object({
  refreshToken: z.string().trim().min(1),
})

export const mfaVerifySchema = z.object({
  challengeToken: z.string().trim().min(16),
  code: z.string().trim().length(4),
})

export const mfaChallengeSchema = z.object({
  challengeToken: z.string().trim().min(16),
})

export const twoFactorCodeSchema = z.object({
  code: z.string().trim().length(4),
})

export type SendCodeInput = z.infer<typeof sendCodeSchema>
export type VerifyCodeInput = z.infer<typeof verifyCodeSchema>
export type SendEmailCodeInput = z.infer<typeof sendEmailCodeSchema>
export type VerifyEmailCodeInput = z.infer<typeof verifyEmailCodeSchema>
export type EmailMagicInput = z.infer<typeof emailMagicSchema>
export type ChangePhoneSendInput = z.infer<typeof changePhoneSendSchema>
export type ChangePhoneVerifyInput = z.infer<typeof changePhoneVerifySchema>
export type ChangePhoneOldVerifyInput = z.infer<typeof changePhoneOldVerifySchema>
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>
export type MfaVerifyInput = z.infer<typeof mfaVerifySchema>
export type MfaChallengeInput = z.infer<typeof mfaChallengeSchema>
export type TwoFactorCodeInput = z.infer<typeof twoFactorCodeSchema>
