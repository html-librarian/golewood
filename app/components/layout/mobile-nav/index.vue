<script setup lang="ts">
const route = useRoute()
const localePath = useLocalePath()

const showNav = computed(() => {
  const path = route.path
  return !path.includes('/admin')
    && !path.includes('/host')
    && !path.includes('/auth')
})

const links = [
  {
    to: '/search',
    label: 'common.search',
    icon: 'ph:magnifying-glass-duotone',
    match: (path: string) => path.startsWith(localePath('/search')) || path === localePath('/'),
  },
  {
    to: '/bookings',
    label: 'common.bookings',
    icon: 'ph:calendar-check-duotone',
    match: (path: string) => path.startsWith(localePath('/bookings')),
  },
  {
    to: '/favorites',
    label: 'common.favorites',
    icon: 'ph:heart-duotone',
    match: (path: string) => path.startsWith(localePath('/favorites')),
  },
] as const

const isActive = (match: (path: string) => boolean) => match(route.path)
</script>

<template>
  <nav
    v-if="showNav"
    class="fixed inset-x-0 bottom-0 z-50 border-t border-stone-200/80 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden dark:border-stone-800/80 dark:bg-stone-950/90"
    :aria-label="$t('common.navMobile')"
  >
    <ul class="mx-auto grid max-w-lg grid-cols-3 gap-1 px-2 pt-1">
      <li
        v-for="link in links"
        :key="link.to"
        class="min-w-0"
      >
        <NuxtLink
          :to="localePath(link.to)"
          class="flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-xs font-medium transition"
          :class="isActive(link.match)
            ? 'text-brand-800 dark:text-brand-200'
            : 'text-stone-600 hover:text-stone-900 dark:text-stone-300 dark:hover:text-stone-100'"
        >
          <Icon
            :name="link.icon"
            class="size-6 shrink-0"
            :class="isActive(link.match) ? 'text-brand-600 dark:text-brand-400' : ''"
          />
          <span class="max-w-full truncate text-center leading-tight">{{ $t(link.label) }}</span>
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>
