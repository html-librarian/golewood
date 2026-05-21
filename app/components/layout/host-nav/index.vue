<script setup lang="ts">
const localePath = useLocalePath()
const route = useRoute()
const { isHostUser } = useHostNavEntry()

const hostOnlyLinks = [
  { to: '/host/bookings', label: 'host.nav.bookings', icon: 'ph:calendar-check-duotone' },
  { to: '/host/gift-certificates', label: 'host.nav.giftCertificates', icon: 'ph:gift-duotone' },
  { to: '/host/promo', label: 'host.nav.promo', icon: 'ph:megaphone-duotone' },
  { to: '/host/payout', label: 'host.nav.payout', icon: 'ph:wallet-duotone' },
] as const

const links = computed(() => {
  const base = [
    { to: '/host', label: 'host.nav.dashboard', icon: 'ph:chart-pie-slice-duotone' },
    { to: '/host/listings', label: 'host.nav.listings', icon: 'ph:house-line-duotone' },
    { to: '/host/guide', label: 'host.nav.guide', icon: 'ph:graduation-cap-duotone' },
  ] as const

  if (!isHostUser.value) {
    return base
  }

  return [
    base[0],
    base[1],
    ...hostOnlyLinks,
    base[2],
  ]
})

const isActive = (path: string) => {
  const target = localePath(path)

  return path === '/host/guide'
    ? route.path.startsWith(target)
    : route.path === target
}
</script>

<template>
  <nav class="border-b border-stone-200/80 bg-white/80 backdrop-blur-sm dark:border-stone-800 dark:bg-stone-950/80">
    <div class="page-container flex gap-1 overflow-x-auto py-2 md:gap-2">
      <NuxtLink
        v-for="link in links"
        :key="`${link.to}-${link.label}`"
        :to="localePath(link.to)"
        class="nav-link flex items-center gap-2 whitespace-nowrap"
        :class="{ 'nav-link-active': isActive(link.to) }"
      >
        <Icon
          :name="link.icon"
          class="size-4 shrink-0"
        />
        {{ $t(link.label) }}
      </NuxtLink>
    </div>
  </nav>
</template>
