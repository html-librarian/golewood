import { PLATFORM_FEE_PERCENT } from '#shared/constants/platform-fee'

export const splitGiftCertificateSettlement = (totalPrice: number) => {
  const platformFee = Math.round(totalPrice * PLATFORM_FEE_PERCENT / 100)
  const hostAmount = totalPrice - platformFee

  return { hostAmount, platformFee }
}

export const generateGiftCertificateCode = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let suffix = ''

  for (let i = 0; i < 8; i += 1) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)]
  }

  return `GW-${suffix}`
}
