<script setup lang="ts">
import type { AdminNavProps } from './types'
import type { UserRole } from '#shared/types/user'

const props = withDefaults(defineProps<AdminNavProps>(), {
  variant: 'horizontal',
})

const localePath = useLocalePath()
const route = useRoute()
const { isFullAdmin, isSupportStaff, isContentStaff } = useStaffAdmin()

type NavLink = {
  to: string
  label: string
  exact?: boolean
  icon: string
  roles: UserRole[]
}

type NavSection = {
  titleKey: string
  links: NavLink[]
}

const sections = computed((): NavSection[] => {
  const all: NavSection[] = [
    {
      titleKey: 'admin.nav.sectionOverview',
      links: [
        {
          to: localePath('/admin'),
          label: 'admin.nav.dashboard',
          exact: true,
          icon: 'ph:squares-four-duotone',
          roles: ['admin'],
        },
      ],
    },
    {
      titleKey: 'admin.nav.sectionSupport',
      links: [
        {
          to: localePath('/admin/reports'),
          label: 'admin.nav.reports',
          icon: 'ph:flag-duotone',
          roles: ['admin', 'support'],
        },
        {
          to: localePath('/admin/support-requests'),
          label: 'admin.nav.supportRequests',
          icon: 'ph:headset-duotone',
          roles: ['admin', 'support'],
        },
      ],
    },
    {
      titleKey: 'admin.nav.sectionOperations',
      links: [
        {
          to: localePath('/admin/listings'),
          label: 'admin.nav.listings',
          icon: 'ph:house-line-duotone',
          roles: ['admin'],
        },
        {
          to: localePath('/admin/users'),
          label: 'admin.nav.users',
          icon: 'ph:users-duotone',
          roles: ['admin'],
        },
        {
          to: localePath('/admin/host-payouts'),
          label: 'admin.nav.hostPayouts',
          icon: 'ph:wallet-duotone',
          roles: ['admin'],
        },
      ],
    },
    {
      titleKey: 'admin.nav.sectionCatalog',
      links: [
        {
          to: localePath('/admin/cities'),
          label: 'admin.nav.cities',
          icon: 'ph:map-trifold-duotone',
          roles: ['admin', 'content_manager'],
        },
        {
          to: localePath('/admin/blog'),
          label: 'admin.nav.blog',
          icon: 'ph:article-duotone',
          roles: ['admin', 'content_manager'],
        },
        {
          to: localePath('/admin/news'),
          label: 'admin.nav.news',
          icon: 'ph:newspaper-duotone',
          roles: ['admin', 'content_manager'],
        },
        {
          to: localePath('/admin/amenities'),
          label: 'admin.nav.amenities',
          icon: 'ph:list-checks-duotone',
          roles: ['admin'],
        },
        {
          to: localePath('/admin/home-discovery'),
          label: 'admin.nav.homeDiscovery',
          icon: 'ph:circles-four-duotone',
          roles: ['admin'],
        },
        {
          to: localePath('/admin/home-promos'),
          label: 'admin.nav.homePromos',
          icon: 'ph:images-duotone',
          roles: ['admin'],
        },
        {
          to: localePath('/admin/team-badges'),
          label: 'admin.nav.teamBadges',
          icon: 'ph:seal-check-duotone',
          roles: ['admin'],
        },
        {
          to: localePath('/admin/spotlight'),
          label: 'admin.nav.spotlight',
          icon: 'ph:camera-duotone',
          roles: ['admin'],
        },
      ],
    },
  ]

  const role = computed(() => {
    if (isFullAdmin.value) {
      return 'admin' as UserRole
    }

    if (isSupportStaff.value && !isFullAdmin.value) {
      return 'support' as UserRole
    }

    if (isContentStaff.value) {
      return 'content_manager' as UserRole
    }

    return undefined
  })

  return all
    .map(section => ({
      ...section,
      links: section.links.filter(link => role.value !== undefined && link.roles.includes(role.value)),
    }))
    .filter(section => section.links.length > 0)
})

const isActive = (to: string, exact?: boolean) =>
  exact ? route.path === to : route.path.startsWith(to)

const linkClass = (active: boolean) => {
  if (props.variant === 'sidebar') {
    return [
      'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition',
      active
        ? 'bg-brand-50 text-brand-800 dark:bg-brand-950 dark:text-brand-200'
        : 'text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800',
    ]
  }

  return ['nav-link', { 'nav-link-active': active }]
}
</script>

<template>
  <nav
    :class="variant === 'sidebar'
      ? 'flex flex-col gap-6 px-3 py-4'
      : 'border-b border-stone-200/80 px-4 py-3 dark:border-stone-800'"
  >
    <div
      :class="variant === 'sidebar' ? 'space-y-6' : 'mx-auto flex max-w-6xl flex-wrap gap-2'"
    >
      <div
        v-for="section in sections"
        :key="section.titleKey"
        :class="variant === 'sidebar' ? 'space-y-1' : 'contents'"
      >
        <p
          v-if="variant === 'sidebar'"
          class="px-3 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400"
        >
          {{ $t(section.titleKey) }}
        </p>
        <NuxtLink
          v-for="link in section.links"
          :key="link.to"
          :to="link.to"
          :class="linkClass(isActive(link.to, link.exact))"
        >
          <Icon
            v-if="link.icon"
            :name="link.icon"
            class="size-4 shrink-0"
          />
          {{ $t(link.label) }}
        </NuxtLink>
      </div>
    </div>
  </nav>
</template>
