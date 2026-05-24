/** Phone generated for legacy email-only sign-up (+7999xxxxxxx). */
export const isSyntheticEmailPhone = (phone: string) => /^\+7999\d{7}$/.test(phone)

/** Phone generated for OAuth until profile is completed (+7998xxxxxxxx). */
export const isSyntheticOAuthPhone = (phone: string) => /^\+7998\d{8}$/.test(phone)

/** Internal placeholder — not a real mobile; must be replaced by the user. */
export const isPlaceholderPhone = (phone: string) =>
  isSyntheticEmailPhone(phone) || isSyntheticOAuthPhone(phone)
