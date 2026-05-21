<script setup lang="ts">
import type { LegalNavItem } from './types'

const localePath = useLocalePath()
const route = useRoute()
const { t } = useI18n()

const items: LegalNavItem[] = [
  { to: '/legal', labelKey: 'legal.nav.overview' },
  { to: '/legal/requisites', labelKey: 'legal.nav.requisites' },
  { to: '/legal/offer', labelKey: 'legal.nav.offer' },
  { to: '/legal/privacy', labelKey: 'legal.nav.privacy' },
  { to: '/legal/terms', labelKey: 'legal.nav.terms' },
]

const isActive = (path: string) => {
  const target = localePath(path)

  if (path === '/legal') {
    return route.path === target
  }

  return route.path === target || route.path.startsWith(`${target}/`)
}
</script>

<template>
  <nav
    class="space-y-1"
    aria-label="Legal"
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
