type SendSmsInput = {
  phone: string
  message: string
  channel?: 'auth' | 'notification'
}

type SendSmsResult = {
  sent: boolean
  provider: 'console' | 'sms.ru'
}

const getSmsConfig = () => {
  const config = useRuntimeConfig()

  return {
    apiId: (config.smsRuApiId as string)?.trim() ?? '',
  }
}

const logSms = (phone: string, message: string) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[sms] ${phone}: ${message}`)
  }
}

const isChannelEnabled = (channel: 'auth' | 'notification') => {
  const config = useRuntimeConfig()

  return channel === 'auth'
    ? Boolean(config.public.smsAuthEnabled)
    : Boolean(config.smsNotificationsEnabled)
}

export const smsService = {
  send: async ({ phone, message, channel = 'notification' }: SendSmsInput): Promise<SendSmsResult> => {
    const { apiId } = getSmsConfig()

    logSms(phone, message)

    if (!isChannelEnabled(channel) || !apiId) {
      return { sent: false, provider: 'console' }
    }

    const params = new URLSearchParams({
      api_id: apiId,
      to: phone.replace(/\D/g, ''),
      msg: message,
      json: '1',
    })

    const response = await $fetch<{ status?: string, status_code?: number }>(
      `https://sms.ru/sms/send?${params.toString()}`,
    )

    if (response.status !== 'OK' && response.status_code !== 100) {
      throw createError({ statusCode: 502, statusMessage: 'SMS delivery failed' })
    }

    return { sent: true, provider: 'sms.ru' }
  },
}
