<script setup lang="ts">
const localePath = useLocalePath()
const route = useRoute()

const links = [
  { to: '/admin', label: 'admin.nav.dashboard', icon: 'ph:gauge-duotone' },
  { to: '/admin/listings', label: 'admin.nav.listings', icon: 'ph:buildings-duotone' },
  { to: '/admin/spotlight', label: 'admin.nav.spotlight', icon: 'ph:camera-duotone' },
  { to: '/admin/blog', label: 'admin.nav.blog', icon: 'ph:article-duotone' },
  { to: '/admin/team-badges', label: 'admin.nav.teamBadges', icon: 'ph:seal-check-duotone' },
  { to: '/admin/users', label: 'admin.nav.users', icon: 'ph:users-duotone' },
  { to: '/admin/reports', label: 'admin.nav.reports', icon: 'ph:flag-duotone' },
  { to: '/admin/cities', label: 'admin.nav.cities', icon: 'ph:map-pin-duotone' },
  { to: '/admin/amenities', label: 'admin.nav.amenities', icon: 'ph:sparkle-duotone' },
  { to: '/admin/home-discovery', label: 'admin.nav.homeDiscovery', icon: 'ph:circles-four-duotone' },
  { to: '/admin/home-promos', label: 'admin.nav.homePromos', icon: 'ph:images-duotone' },
] as const

const isActive = (path: string) => route.path === localePath(path)
</script>

<template>
  <nav class="border-b border-stone-200/80 bg-white/80 backdrop-blur-sm dark:border-stone-800 dark:bg-stone-950/80">
    <div class="page-container flex gap-1 overflow-x-auto py-2 md:gap-2">
      <NuxtLink
        v-for="link in links"
        :key="link.to"
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
