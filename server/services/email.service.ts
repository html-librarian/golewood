type SendEmailInput = {
  to: string
  subject: string
  text: string
}

type SendEmailResult = {
  sent: boolean
  provider: 'console' | 'smtp'
}

const getEmailConfig = () => {
  const config = useRuntimeConfig()

  return {
    smtpUrl: (config.smtpUrl as string)?.trim() ?? '',
  }
}

const logEmail = (to: string, subject: string, text: string) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[email] ${to}: ${subject} — ${text}`)
  }
}

export const emailService = {
  send: async ({ to, subject, text }: SendEmailInput): Promise<SendEmailResult> => {
    const { smtpUrl } = getEmailConfig()

    logEmail(to, subject, text)

    if (!smtpUrl) {
      return { sent: false, provider: 'console' }
    }

    const response = await fetch(smtpUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, text }),
    })

    if (!response.ok) {
      throw createError({ statusCode: 502, statusMessage: 'Email delivery failed' })
    }

    return { sent: true, provider: 'smtp' }
  },
}
