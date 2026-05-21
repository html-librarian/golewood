/** Навигация в раздел сдачи жилья: для гостя — вход, для хозяина — кабинет. */
export const useHostNavEntry = () => {
  const { user } = useAuth()

  const isHostUser = computed(() => {
    const role = user.value?.role
    return role === 'host' || role === 'admin'
  })

  const labelKey = computed(() =>
    isHostUser.value ? 'common.hostCabinet' : 'common.rentOut',
  )

  return {
    isHostUser,
    to: '/host' as const,
    labelKey,
  }
}
