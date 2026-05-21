export interface HostCalendarGoogleLabels {
  title: string
  hint: string
  connect: string
  connectedAs: string
  disconnect: string
  selectCalendar: string
  feedLabel: string
  addFeed: string
  adding: string
  notConfiguredDev: string
  loadCalendarsError: string
  addFeedError: string
}

export interface HostCalendarGoogleProps {
  listingId: string
  labels: HostCalendarGoogleLabels
}

export interface HostCalendarGoogleEmits {
  changed: []
}
