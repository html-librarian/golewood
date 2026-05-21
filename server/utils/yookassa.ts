interface YookassaAmount {
  value: string
  currency: string
}

interface YookassaPaymentResponse {
  id: string
  status: string
  confirmation?: {
    confirmation_url?: string
  }
}

interface YookassaRefundResponse {
  id: string
  status: string
}

export interface YookassaTransferInput {
  account_id: string
  amount: YookassaAmount
  platform_fee_amount: YookassaAmount
  description: string
  metadata?: Record<string, string>
}

export interface CreateYookassaPaymentInput {
  amount: YookassaAmount
  capture: boolean
  confirmation: {
    type: 'redirect'
    return_url: string
  }
  description: string
  metadata: Record<string, string>
  transfers?: YookassaTransferInput[]
}

export interface CaptureYookassaPaymentInput {
  transfers?: YookassaTransferInput[]
}

const yookassaRequest = async <T>(
  shopId: string,
  secretKey: string,
  method: string,
  path: string,
  body?: unknown,
  idempotenceKey?: string,
): Promise<T> => {
  const auth = Buffer.from(`${shopId}:${secretKey}`).toString('base64')
  const headers: Record<string, string> = {
    Authorization: `Basic ${auth}`,
    'Content-Type': 'application/json',
  }

  if (idempotenceKey) {
    headers['Idempotence-Key'] = idempotenceKey
  }

  const response = await fetch(`https://api.yookassa.ru/v3${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await response.json()

  if (!response.ok) {
    throw createError({
      statusCode: 502,
      statusMessage: data?.description ?? 'YooKassa request failed',
    })
  }

  return data as T
}

export const formatYookassaAmount = (amountRub: number) => ({
  value: `${amountRub}.00`,
  currency: 'RUB',
})

export const createYookassaClient = (shopId: string, secretKey: string) => ({
  createPayment: (input: CreateYookassaPaymentInput, idempotenceKey: string) =>
    yookassaRequest<YookassaPaymentResponse>(
      shopId,
      secretKey,
      'POST',
      '/payments',
      input,
      idempotenceKey,
    ),

  capturePayment: (
    paymentId: string,
    idempotenceKey: string,
    body: CaptureYookassaPaymentInput = {},
  ) =>
    yookassaRequest<YookassaPaymentResponse>(
      shopId,
      secretKey,
      'POST',
      `/payments/${paymentId}/capture`,
      Object.keys(body).length > 0 ? body : undefined,
      idempotenceKey,
    ),

  cancelPayment: (paymentId: string, idempotenceKey: string) =>
    yookassaRequest<YookassaPaymentResponse>(
      shopId,
      secretKey,
      'POST',
      `/payments/${paymentId}/cancel`,
      {},
      idempotenceKey,
    ),

  createRefund: (
    paymentId: string,
    amount: YookassaAmount,
    idempotenceKey: string,
  ) =>
    yookassaRequest<YookassaRefundResponse>(
      shopId,
      secretKey,
      'POST',
      '/refunds',
      { payment_id: paymentId, amount },
      idempotenceKey,
    ),
})

export const mapYookassaStatus = (status: string): 'pending' | 'waiting_for_capture' | 'succeeded' | 'cancelled' => {
  switch (status) {
    case 'waiting_for_capture':
      return 'waiting_for_capture'
    case 'succeeded':
      return 'succeeded'
    case 'canceled':
      return 'cancelled'
    default:
      return 'pending'
  }
}
