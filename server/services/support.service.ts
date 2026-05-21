import type { SupportContactInput } from '#shared/schemas/support'
import { emailService } from './email.service'
import { supportRequestService } from './support-request.service'

const DEFAULT_SUPPORT_EMAIL = 'support@golewood.ru'

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
    const to = (config.supportEmail as string)?.trim() || DEFAULT_SUPPORT_EMAIL
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
