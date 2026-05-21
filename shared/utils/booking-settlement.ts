/** Доли хоста и платформы при оплате картой (с учётом бонусов). */
export const scaleSettlementForCashDue = (
  hostAmount: number,
  platformFee: number,
  totalPrice: number,
  cashDue: number,
) => {
  if (cashDue <= 0 || totalPrice <= 0) {
    return { hostAmount: 0, platformFee: 0 }
  }

  if (cashDue >= totalPrice) {
    return { hostAmount, platformFee }
  }

  const hostShare = Math.round(hostAmount * cashDue / totalPrice)
  const platformShare = cashDue - hostShare

  return {
    hostAmount: hostShare,
    platformFee: platformShare,
  }
}
