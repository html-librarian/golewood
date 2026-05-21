export interface AuthEmailSignInLabels {
  emailLabel: string
  codeLabel: string
  sendCode: string
  submit: string
  devCode: string
  errorSendCode: string
  errorInvalidCode: string
  errorConflict?: string
  nameLabel?: string
  phoneLabel?: string
  linkPhoneHint?: string
}

export interface AuthEmailSignInProps {
  labels: AuthEmailSignInLabels
  registerMode?: boolean
  /** Show optional phone field to merge with an existing phone account. */
  allowPhoneLink?: boolean
}

