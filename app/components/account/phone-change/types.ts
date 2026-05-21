export interface AccountPhoneChangeLabels {
  title: string
  subtitle: string
  syntheticHint: string
  currentSubtitle: string
  currentCodeLabel: string
  sendCurrentCode: string
  verifyCurrentCode: string
  phoneLabel: string
  codeLabel: string
  sendCode: string
  submit: string
  devCode: string
  errorSendCode: string
  errorInvalidCode: string
  errorConflict: string
  errorNeedCurrent: string
  smsDisabled: string
}

export interface AccountPhoneChangeProps {
  labels: AccountPhoneChangeLabels
  currentPhone: string
}
