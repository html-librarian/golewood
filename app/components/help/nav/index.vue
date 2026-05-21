<script setup lang="ts">
import type { HelpNavItem } from './types'

const localePath = useLocalePath()
const route = useRoute()
const { t } = useI18n()

const items: HelpNavItem[] = [
  { to: '/help', labelKey: 'help.nav.overview' },
  { to: '/help/faq', labelKey: 'help.nav.faq' },
  { to: '/help/become-host', labelKey: 'help.nav.becomeHost' },
  { to: '/help/create-listing', labelKey: 'help.nav.createListing' },
  { to: '/help/support', labelKey: 'help.nav.support' },
]

const isActive = (path: string) => {
  const target = localePath(path)

  if (path === '/help') {
    return route.path === target
  }

  return route.path === target || route.path.startsWith(`${target}/`)
}
</script>

<template>
  <nav
    class="space-y-1"
    aria-label="Help"
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
