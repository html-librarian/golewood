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
    :aria-label="t('help.nav.ariaLabel')"
  >
    <NuxtLink
      v-for="item in items"
      :key="item.to"
      :to="localePath(item.to)"
      class="legal-nav-link"
      :class="{ 'legal-nav-link-active': isActive(item.to) }"
    >
      {{ t(item.labelKey) }}
    </NuxtLink>
  </nav>
</template>
