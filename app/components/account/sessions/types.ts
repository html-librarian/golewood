export interface AccountSessionsLabels {
  title: string
  subtitle: string
  current: string
  lastActive: string
  revoke: string
  revokeOthers: string
  empty: string
  loadError: string
  retry: string
  deviceUnknown: string
  devicePhone: string
  justNow: string
  minutesAgo: (n: number) => string
  hoursAgo: (n: number) => string
  daysAgo: (n: number) => string
  showMore: (n: number) => string
}
