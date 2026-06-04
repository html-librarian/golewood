<script setup lang="ts">
import { formatUserDisplayName, formatUserInitials } from '#shared/utils/user-display'

const route = useRoute()
const { locale, locales, setLocale } = useI18n()
const colorMode = useColorMode()
const localePath = useLocalePath()
const { user, isAuthenticated } = useAuth()
const { to: hostNavTo, labelKey: hostNavLabelKey } = useHostNavEntry()
const { unreadCount } = useMessagesUnread()

const mobileMenuOpen = ref(false)

const navLinks = computed(() => {
  const links: Array<{ to: string, label: string, accent?: 'spotlight' }> = [
    { to: '/search', label: 'common.search' },
    { to: '/spotlight', label: 'spotlight.link', accent: 'spotlight' },
    { to: '/blog', label: 'blog.link' },
  ]

  if (isAuthenticated.value) {
    links.push(
      { to: '/bookings', label: 'common.bookings' },
      { to: hostNavTo, label: hostNavLabelKey.value },
    )
  }

  if (user.value?.role && ['admin', 'support', 'content_manager'].includes(user.value.role)) {
    links.push({ to: '/admin', label: 'common.admin' })
  }

  return links
})

const userQuickLinks = computed(() => {
  if (!isAuthenticated.value) {
    return []
  }

  const links: Array<{
    to: string
    labelKey: string
    icon: string
    testId?: string
    showUnreadBadge?: boolean
  }> = []

  if (user.value?.role === 'guest') {
    links.push({
      to: '/stories',
      labelKey: 'story.myStories',
      icon: 'ph:circle-half-duotone',
      testId: 'nav-stories-icon',
    })
  }

  links.push({
    to: '/blog/my',
    labelKey: 'blog.myPosts',
    icon: 'ph:article-duotone',
    testId: 'nav-blog-icon',
  })

  links.push(
    {
      to: '/messages',
      labelKey: 'common.messages',
      icon: 'ph:chat-circle-dots-duotone',
      testId: 'nav-messages-icon',
      showUnreadBadge: true,
    },
    {
      to: '/favorites',
      labelKey: 'common.favorites',
      icon: 'ph:heart-duotone',
      testId: 'nav-favorites-icon',
    },
  )

  return links
})

const headerIconClass = (active: boolean) => [
  'relative flex size-9 shrink-0 items-center justify-center rounded-xl border border-stone-200 text-stone-600 transition hover:bg-stone-100 dark:border-stone-700 dark:text-stone-400 dark:hover:bg-stone-800',
  active
    ? 'border-brand-600 bg-brand-100 text-brand-950 dark:border-brand-500 dark:bg-brand-900/90 dark:text-brand-50'
    : '',
]

const isActive = (path: string) => {
  const target = localePath(path)
  return route.path === target || route.path.startsWith(`${target}/`)
}

const toggleTheme = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

const { headerRef } = useSiteHeaderHeight()

const userDisplayName = computed(() =>
  user.value ? formatUserDisplayName(user.value) : '',
)

const userInitials = computed(() => formatUserInitials(user.value ?? undefined))

watch(() => route.fullPath, () => {
  closeMobileMenu()
})

watch(mobileMenuOpen, (open) => {
  if (import.meta.client) {
    document.body.classList.toggle('overflow-hidden', open)
  }
})

onBeforeUnmount(() => {
  if (import.meta.client) {
    document.body.classList.remove('overflow-hidden')
  }
})
</script>

<template>
  <header
    ref="headerRef"
    class="sticky top-0 z-50 border-b border-stone-200/60 bg-white/80 backdrop-blur-2xl backdrop-saturate-150 dark:border-stone-800/60 dark:bg-stone-950/80"
  >
    <div class="layout-container flex items-center gap-2 py-3 sm:gap-3">
      <NuxtLink
        :to="localePath('/')"
        class="group flex h-9 shrink-0 items-center gap-2"
      >
        <span class="flex size-9 items-center justify-center rounded-xl bg-linear-to-br from-brand-600 to-brand-800 text-white shadow-md shadow-brand-900/20 transition group-hover:from-brand-700 group-hover:to-brand-900 dark:from-brand-500 dark:to-brand-700">
          <Icon
            name="ph:tree-evergreen-duotone"
            class="size-5"
          />
        </span>
        <span class="font-display text-lg font-semibold leading-none tracking-tight text-stone-900 sm:text-xl dark:text-stone-50">
          Golewood
        </span>
      </NuxtLink>

      <NuxtLink
        :to="localePath('/search')"
        class="flex size-9 shrink-0 items-center justify-center rounded-xl border border-stone-200 text-stone-600 transition hover:bg-stone-100 xl:hidden dark:border-stone-700 dark:text-stone-400 dark:hover:bg-stone-800"
        :class="{ 'border-brand-600 bg-brand-100 text-brand-950 dark:border-brand-500 dark:bg-brand-900/90 dark:text-brand-50': isActive('/search') }"
        :aria-label="$t('common.search')"
        data-testid="nav-search-icon"
      >
        <Icon
          name="ph:magnifying-glass-duotone"
          class="size-5"
        />
      </NuxtLink>

      <nav
        class="hidden min-w-0 flex-1 justify-center px-1 xl:flex"
        :aria-label="$t('common.navMain')"
      >
        <ul class="flex max-w-full flex-wrap items-center justify-center gap-0.5">
          <li
            v-for="link in navLinks"
            :key="link.to"
          >
            <NuxtLink
              :to="localePath(link.to)"
              class="nav-link relative inline-flex items-center whitespace-nowrap px-2.5"
              :class="{
                'nav-link-active': isActive(link.to),
                'nav-link-spotlight': link.accent === 'spotlight',
              }"
            >
              <Icon
                v-if="link.accent === 'spotlight'"
                name="ph:camera-duotone"
                class="size-4 shrink-0 text-accent-500 dark:text-accent-400"
                aria-hidden="true"
              />
              {{ $t(link.label) }}
            </NuxtLink>
          </li>
        </ul>
      </nav>

      <div class="ml-auto flex h-9 shrink-0 items-center gap-1.5 sm:gap-2">
        <div class="hidden h-9 items-center rounded-xl border border-stone-200 bg-stone-50 p-0.5 sm:flex dark:border-stone-700 dark:bg-stone-900">
          <button
            v-for="item in locales"
            :key="item.code"
            type="button"
            class="flex h-full items-center rounded-lg px-2 text-xs font-medium transition"
            :class="locale === item.code
              ? 'bg-white text-brand-900 shadow-sm dark:bg-stone-800 dark:text-brand-100'
              : 'text-stone-600 hover:text-stone-900 dark:text-stone-300 dark:hover:text-stone-100'"
            @click="setLocale(item.code)"
          >
            {{ item.code.toUpperCase() }}
          </button>
        </div>

        <button
          type="button"
          class="flex size-9 shrink-0 items-center justify-center rounded-xl border border-stone-200 text-stone-600 transition hover:bg-stone-100 dark:border-stone-700 dark:text-stone-400 dark:hover:bg-stone-800"
          :aria-label="$t('common.theme')"
          :title="$t('common.theme')"
          @click="toggleTheme"
        >
          <Icon
            :name="colorMode.value === 'dark' ? 'ph:sun-duotone' : 'ph:moon-duotone'"
            class="size-5"
          />
        </button>

        <NuxtLink
          v-for="link in userQuickLinks"
          :key="link.to"
          :to="localePath(link.to)"
          :class="headerIconClass(isActive(link.to))"
          :aria-label="$t(link.labelKey)"
          :data-testid="link.testId"
        >
          <Icon
            :name="link.icon"
            class="size-5"
          />
          <span
            v-if="link.showUnreadBadge && unreadCount > 0"
            data-testid="messages-unread-badge"
            class="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white"
          >
            {{ unreadCount > 9 ? '9+' : unreadCount }}
          </span>
        </NuxtLink>

        <NuxtLink
          v-if="!isAuthenticated"
          :to="localePath('/auth/login')"
          class="hidden shrink-0 sm:inline-flex"
        >
          <UiButton size="sm">
            {{ $t('common.login') }}
          </UiButton>
        </NuxtLink>

        <NuxtLink
          v-else
          :to="localePath('/account')"
          class="flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-2 text-xs font-medium text-stone-700 transition hover:bg-stone-100 sm:px-2.5 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
          :title="userDisplayName || $t('common.account')"
        >
          <span class="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-semibold text-brand-800 dark:bg-brand-900 dark:text-brand-200">
            {{ userInitials }}
          </span>
          <span class="hidden max-w-30 truncate 2xl:inline">{{ userDisplayName }}</span>
        </NuxtLink>

        <button
          type="button"
          class="relative flex size-9 shrink-0 items-center justify-center rounded-xl border border-stone-200 text-stone-600 transition hover:bg-stone-100 xl:hidden dark:border-stone-700 dark:text-stone-400 dark:hover:bg-stone-800"
          :aria-label="mobileMenuOpen ? $t('common.closeMenu') : $t('common.menu')"
          :aria-expanded="mobileMenuOpen"
          data-testid="nav-burger"
          @click="toggleMobileMenu"
        >
          <Icon
            :name="mobileMenuOpen ? 'ph:x-bold' : 'ph:list-bold'"
            class="size-5"
          />
        </button>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="mobileMenuOpen"
        class="fixed inset-0 z-200 xl:hidden"
        data-testid="nav-mobile-menu"
      >
        <button
          type="button"
          class="absolute inset-0 bg-stone-900/40 backdrop-blur-[2px]"
          :aria-label="$t('common.closeMenu')"
          @click="closeMobileMenu"
        />

        <nav
          class="absolute right-0 top-0 flex h-full w-[min(100%,20rem)] flex-col gap-1 overflow-y-auto border-l border-stone-200 bg-white p-4 pt-[max(1rem,env(safe-area-inset-top))] shadow-xl dark:border-stone-800 dark:bg-stone-950"
        >
          <p class="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
            {{ $t('common.menu') }}
          </p>

          <NuxtLink
            v-for="link in navLinks"
            :key="link.to"
            :to="localePath(link.to)"
            class="nav-link relative inline-flex items-center rounded-xl px-3 py-2.5"
            :class="{
              'nav-link-active': isActive(link.to),
              'nav-link-spotlight': link.accent === 'spotlight',
            }"
            @click="closeMobileMenu"
          >
            <Icon
              v-if="link.accent === 'spotlight'"
              name="ph:camera-duotone"
              class="mr-2 size-4 shrink-0 text-accent-500 dark:text-accent-400"
              aria-hidden="true"
            />
            {{ $t(link.label) }}
          </NuxtLink>

          <template v-if="isAuthenticated">
            <p class="mb-2 mt-4 px-3 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
              {{ $t('common.account') }}
            </p>

            <NuxtLink
              v-for="link in userQuickLinks"
              :key="`mobile-${link.to}`"
              :to="localePath(link.to)"
              class="nav-link inline-flex items-center gap-2 rounded-xl px-3 py-2.5"
              :class="{ 'nav-link-active': isActive(link.to) }"
              @click="closeMobileMenu"
            >
              <Icon
                :name="link.icon"
                class="size-4 shrink-0"
              />
              {{ $t(link.labelKey) }}
            </NuxtLink>
          </template>

          <div class="mt-4 flex items-center gap-2 border-t border-stone-200 pt-4 dark:border-stone-800">
            <div class="flex h-9 flex-1 items-center rounded-xl border border-stone-200 bg-stone-50 p-0.5 dark:border-stone-700 dark:bg-stone-900">
              <button
                v-for="item in locales"
                :key="item.code"
                type="button"
                class="flex h-full flex-1 items-center justify-center rounded-lg text-xs font-medium transition"
                :class="locale === item.code
                  ? 'bg-white text-brand-900 shadow-sm dark:bg-stone-800 dark:text-brand-100'
                  : 'text-stone-600 dark:text-stone-300'"
                @click="setLocale(item.code)"
              >
                {{ item.code.toUpperCase() }}
              </button>
            </div>
          </div>

          <NuxtLink
            v-if="!isAuthenticated"
            :to="localePath('/auth/login')"
            class="mt-2"
            @click="closeMobileMenu"
          >
            <UiButton class="w-full">
              {{ $t('common.login') }}
            </UiButton>
          </NuxtLink>
        </nav>
      </div>
    </Teleport>
  </header>
</template>
