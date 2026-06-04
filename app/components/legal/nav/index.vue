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
    :aria-label="t('legal.nav.ariaLabel')"
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
