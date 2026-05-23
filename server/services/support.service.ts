import type { SupportContactInput } from '#shared/schemas/support'
import { PLATFORM_SUPPORT_EMAIL } from '#shared/constants/platform-legal'
import { emailService } from './email.service'
import { supportRequestService } from './support-request.service'

const resolveSupportEmail = (value: unknown): string =>
  (value != null && String(value).trim()) || PLATFORM_SUPPORT_EMAIL

const buildSupportEmailBody = (input: SupportContactInput) => {
  const lines = [
    `Имя: ${input.name}`,
    `Email: ${input.email}`,
  ]

  if (input.contextUrl) {
    lines.push(`Ссылка: ${input.contextUrl}`)
  }

  lines.push('', input.message)

  return lines.join('\n')
}

export const supportService = {
  sendContactMessage: async (input: SupportContactInput) => {
    const request = await supportRequestService.createFromContact(input)
    const config = useRuntimeConfig()
    const to = resolveSupportEmail(config.supportEmail)
    const subject = `[Golewood] ${input.name}`
    const text = buildSupportEmailBody(input)
    const result = await emailService.send({ to, subject, text })

    return {
      ok: true,
      delivered: result.sent,
      requestId: request.id,
    }
  },
}
