export type AccountNavLink = {
  to: string
  icon: string
  labelKey: 'profile' | 'balance' | 'giftCertificates' | 'bookings' | 'favorites' | 'messages' | 'stories' | 'rentOut' | 'host' | 'admin'
}

export const useAccountNavLinks = () => {
  const { user } = useAuth()

  const links = computed((): AccountNavLink[] => {
    const items: AccountNavLink[] = [
      { to: '/account', icon: 'ph:user-circle-duotone', labelKey: 'profile' },
      { to: '/account/balance', icon: 'ph:wallet-duotone', labelKey: 'balance' },
      { to: '/account/gift-certificates', icon: 'ph:gift-duotone', labelKey: 'giftCertificates' },
      { to: '/bookings', icon: 'ph:calendar-check-duotone', labelKey: 'bookings' },
      { to: '/favorites', icon: 'ph:heart-duotone', labelKey: 'favorites' },
      { to: '/messages', icon: 'ph:chat-circle-dots-duotone', labelKey: 'messages' },
    ]

    if (user.value?.role === 'guest') {
      items.push({ to: '/stories', icon: 'ph:film-strip-duotone', labelKey: 'stories' })
      items.push({ to: '/host', icon: 'ph:house-line-duotone', labelKey: 'rentOut' })
    }

    if (user.value?.role === 'host' || user.value?.role === 'admin') {
      items.push({ to: '/host', icon: 'ph:house-line-duotone', labelKey: 'host' })
    }

    if (canAccessAdminPanel(user.value?.role)) {
      items.push({ to: '/admin', icon: 'ph:shield-check-duotone', labelKey: 'admin' })
    }

    return items
  })

  const roleLabelKey = computed(() => {
    const role = user.value?.role
    if (role === 'guest' || role === 'host' || role === 'admin' || role === 'support') {
      return `roles.${role}` as const
    }

    if (role === 'content_manager') {
      return 'roles.contentManager' as const
    }
    return null
  })

  return { links, user, roleLabelKey }
}
