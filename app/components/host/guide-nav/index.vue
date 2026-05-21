<script setup lang="ts">
import type { HostGuideNavItem } from './types'

const localePath = useLocalePath()
const route = useRoute()
const { t } = useI18n()

const items: HostGuideNavItem[] = [
  { to: '/host/guide', labelKey: 'host.guide.nav.overview' },
  { to: '/host/guide/listings', labelKey: 'host.guide.nav.listings' },
  { to: '/host/guide/bookings', labelKey: 'host.guide.nav.bookings' },
  { to: '/host/guide/calendar', labelKey: 'host.guide.nav.calendar' },
  { to: '/host/guide/messages', labelKey: 'host.guide.nav.messages' },
  { to: '/host/guide/promo', labelKey: 'host.guide.nav.promo' },
]

const isActive = (path: string) => {
  const target = localePath(path)

  return path === '/host/guide'
    ? route.path === target
    : route.path.startsWith(target)
}
</script>

<template>
  <nav
    class="space-y-1"
    :aria-label="t('host.guide.navAria')"
  >
    <NuxtLink
      v-for="item in items"
      :key="item.to"
      :to="localePath(item.to)"
      class="block rounded-xl px-3 py-2 text-sm font-medium transition"
      :class="isActive(item.to)
        ? 'bg-brand-50 text-brand-800 dark:bg-brand-950 dark:text-brand-200'
        : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100'"
    >
      {{ t(item.labelKey) }}
    </NuxtLink>
  </nav>
</template>
