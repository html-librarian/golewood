export interface GoogleCalendarConnectionStatus {
  connected: boolean
  googleEmail: string | null
  configured: boolean
}

export interface GoogleCalendarOption {
  id: string
  summary: string
  primary: boolean
}
