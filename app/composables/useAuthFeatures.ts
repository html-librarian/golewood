export const useAuthFeatures = () => {
  const config = useRuntimeConfig()

  const smsAuthEnabled = computed(() => Boolean(config.public.smsAuthEnabled))
  const emailAuthEnabled = computed(() => Boolean(config.public.emailAuthEnabled))

  /** Phone OTP only when explicitly enabled (no dev override — SMS.ru is not used). */
  const phoneAuthEnabled = computed(() => smsAuthEnabled.value)

  /** Email OTP when SMTP/public flag or dev (NUXT_AUTH_DEV_CODE on server). */
  const emailSignInEnabled = computed(() => emailAuthEnabled.value || import.meta.dev)

  return { smsAuthEnabled, phoneAuthEnabled, emailAuthEnabled, emailSignInEnabled }
}
