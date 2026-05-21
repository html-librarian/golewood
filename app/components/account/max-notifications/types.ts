import type { MaxLinkStatus } from '#shared/types/max'

export interface AccountMaxNotificationsLabels {
  title: string
  subtitle: string
  disabledHint: string
  connect: string
  linked: string
  unlink: string
  openBot: string
  codeExpires: string
  loadError: string
  linkError: string
  unlinkError: string
  mockLink: string
}

export interface AccountMaxNotificationsProps {
  labels: AccountMaxNotificationsLabels
}

export interface AccountMaxNotificationsEmits {
  updated: [status: MaxLinkStatus]
}
