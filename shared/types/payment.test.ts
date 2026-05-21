import { describe, expect, it } from 'vitest'
import { isPaymentPaid } from './payment'

describe('payment types', () => {
  it('detects paid statuses', () => {
    expect(isPaymentPaid('waiting_for_capture')).toBe(true)
    expect(isPaymentPaid('succeeded')).toBe(true)
    expect(isPaymentPaid('pending')).toBe(false)
    expect(isPaymentPaid('cancelled')).toBe(false)
  })
})
