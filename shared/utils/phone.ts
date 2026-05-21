export const normalizePhone = (value: string) => {
  const digits = value.replace(/\D/g, '')

  if (digits.length === 11 && digits.startsWith('8')) {
    return `+7${digits.slice(1)}`
  }

  if (digits.length === 11 && digits.startsWith('7')) {
    return `+${digits}`
  }

  if (digits.length === 10) {
    return `+7${digits}`
  }

  return value.startsWith('+') ? value : `+${digits}`
}

/** Mask for UI when confirming the current number (+7 *** *** XX XX). */
export const maskPhoneForVerification = (value: string) => {
  const digits = normalizePhone(value).replace(/\D/g, '')

  if (digits.length !== 11) {
    return '***'
  }

  return `+7 *** *** ${digits.slice(7, 9)} ${digits.slice(9, 11)}`
}

export const formatPhoneDisplay = (value: string) => {
  const phone = normalizePhone(value)
  const digits = phone.replace(/\D/g, '')

  if (digits.length !== 11) {
    return value
  }

  return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`
}
