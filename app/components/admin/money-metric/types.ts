import type { AdminMoneyPeriod } from '#shared/types/admin'

export interface AdminMoneyMetricProps {
  label: string
  period: AdminMoneyPeriod
  allTimeLabel: string
  last30Label: string
  comingSoon?: boolean
  comingSoonLabel?: string
}
