export const useMaxFeatures = () => {
  const config = useRuntimeConfig()

  /** Mirrors NUXT_PUBLIC_MAX_NOTIFICATIONS_ENABLED (+ server token). */
  const maxNotificationsEnabled = computed(() => Boolean(config.public.maxNotificationsEnabled))

  return { maxNotificationsEnabled }
}
