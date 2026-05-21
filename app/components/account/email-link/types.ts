export interface AccountEmailLinkLabels {
  title: string
  subtitle: string
  linked: string
  emailLabel: string
  codeLabel: string
  sendCode: string
  submit: string
  unlink: string
  change: string
  devCode: string
  errorSendCode: string
  errorInvalidCode: string
  errorConflict: string
}

export interface AccountEmailLinkProps {
  labels: AccountEmailLinkLabels
  currentEmail: string | null
}
