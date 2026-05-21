<script setup lang="ts">
const route = useRoute()
const localePath = useLocalePath()
const { isAuthenticated, user } = useAuth()
const { to: hostNavTo, labelKey: hostNavLabelKey } = useHostNavEntry()
const { unreadCount } = useMessagesUnread()

const showNav = computed(() => {
  const path = route.path
  return !path.includes('/admin')
    && !path.includes('/host')
    && !path.includes('/auth')
})

const links = computed(() => {
  const items = [
    {
      to: '/search',
      label: 'common.search',
      icon: 'ph:magnifying-glass-duotone',
      match: (path: string) => path.startsWith(localePath('/search')) || path === localePath('/'),
    },
  ]

  if (isAuthenticated.value) {
    items.push(
      {
        to: '/bookings',
        label: 'common.bookings',
        icon: 'ph:calendar-check-duotone',
        match: (path: string) => path.startsWith(localePath('/bookings')),
      },
      {
        to: '/messages',
        label: 'common.messages',
        icon: 'ph:chat-circle-dots-duotone',
        match: (path: string) => path.startsWith(localePath('/messages')),
      },
      {
        to: '/favorites',
        label: 'common.favorites',
        icon: 'ph:heart-duotone',
        match: (path: string) => path.startsWith(localePath('/favorites')),
      },
      {
        to: hostNavTo,
        label: hostNavLabelKey.value,
        icon: 'ph:house-line-duotone',
        match: (path: string) => path.startsWith(localePath('/host')),
      },
    )

    if (user.value?.role && ['admin', 'support', 'content_manager'].includes(user.value.role)) {
      items.push({
        to: '/admin',
        label: 'common.admin',
        icon: 'ph:shield-check-duotone',
        match: (path: string) => path.startsWith(localePath('/admin')),
      })
    }
  } else {
    items.push({
      to: '/auth/login',
      label: 'common.login',
      icon: 'ph:user-circle-duotone',
      match: (path: string) =>
        path.startsWith(localePath('/auth/login'))
        || path.startsWith(localePath('/auth/register')),
    })
  }

  return items
})

const isActive = (match: (path: string) => boolean) => match(route.path)
</script>

<template>
  <nav
    v-if="showNav"
    class="fixed inset-x-0 bottom-0 z-50 border-t border-stone-200/80 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden dark:border-stone-800/80 dark:bg-stone-950/90"
    aria-label="Mobile navigation"
  >
    <ul class="mx-auto flex max-w-lg items-stretch justify-around px-2 pt-1">
      <li
        v-for="link in links"
        :key="link.to"
        class="min-w-0 flex-1"
      >
        <NuxtLink
          :to="localePath(link.to)"
          class="relative flex flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-[10px] font-medium transition"
          :class="isActive(link.match)
            ? 'text-brand-700 dark:text-brand-300'
            : 'text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200'"
        >
          <Icon
            :name="link.icon"
            class="size-6 shrink-0"
            :class="isActive(link.match) ? 'text-brand-600 dark:text-brand-400' : ''"
          />
          <span
            v-if="link.to === '/messages' && unreadCount > 0"
            data-testid="messages-unread-badge"
            class="absolute right-3 top-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-semibold text-white"
          >
            {{ unreadCount > 9 ? '9+' : unreadCount }}
          </span>
          <span class="truncate">{{ $t(link.label) }}</span>
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>
