export interface AccountTwoFactorLabels {
  title: string
  subtitle: string
  enabled: string
  disabled: string
  needEmail: string
  codeLabel: string
  sendEnableCode: string
  confirmEnable: string
  sendDisableCode: string
  confirmDisable: string
  devCode: string
  errorSendCode: string
  errorInvalidCode: string
  loadError: string
}

export interface AccountTwoFactorProps {
  labels: AccountTwoFactorLabels
  hasEmail: boolean
}
