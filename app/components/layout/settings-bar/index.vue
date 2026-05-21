<script setup lang="ts">
const route = useRoute()
const { locale, locales, setLocale } = useI18n()
const colorMode = useColorMode()
const localePath = useLocalePath()
const { user, isAuthenticated } = useAuth()
const { to: hostNavTo, labelKey: hostNavLabelKey } = useHostNavEntry()
const { unreadCount } = useMessagesUnread()

const mobileMenuOpen = ref(false)

const navLinks = computed(() => {
  const links = [
    { to: '/search', label: 'common.search' },
    { to: '/spotlight', label: 'spotlight.link' },
    { to: '/blog', label: 'blog.link' },
  ]

  if (isAuthenticated.value) {
    links.push(
      { to: '/bookings', label: 'common.bookings' },
      { to: '/messages', label: 'common.messages' },
      { to: '/favorites', label: 'common.favorites' },
      { to: hostNavTo, label: hostNavLabelKey.value },
    )

    if (user.value?.role === 'guest') {
      links.splice(1, 0, { to: '/stories', label: 'story.myStories' })
    }
  }

  if (user.value?.role && ['admin', 'support', 'content_manager'].includes(user.value.role)) {
    links.push({ to: '/admin', label: 'common.admin' })
  }

  return links
})

const burgerNavLinks = computed(() => navLinks.value.filter(link => link.to !== '/search'))

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
    class="sticky top-0 z-50 border-b border-stone-200/70 bg-white/85 backdrop-blur-xl dark:border-stone-800/80 dark:bg-stone-950/85"
  >
    <div class="layout-container flex items-center justify-between gap-3 py-3">
      <div class="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <NuxtLink
          :to="localePath('/')"
          class="group flex h-9 shrink-0 items-center gap-2.5"
        >
          <span class="flex size-9 items-center justify-center rounded-xl bg-brand-700 text-white shadow-sm transition group-hover:bg-brand-800 dark:bg-brand-600">
            <Icon
              name="ph:tree-evergreen-duotone"
              class="size-5"
            />
          </span>
          <span class="font-display text-xl font-semibold leading-none tracking-tight text-stone-900 dark:text-stone-50">
            Golewood
          </span>
        </NuxtLink>

        <NuxtLink
          :to="localePath('/search')"
          class="flex size-9 shrink-0 items-center justify-center rounded-xl border border-stone-200 text-stone-600 transition hover:bg-stone-100 md:hidden dark:border-stone-700 dark:text-stone-400 dark:hover:bg-stone-800"
          :class="{ 'border-brand-600 bg-brand-50 text-brand-800 dark:border-brand-500 dark:bg-brand-950/50 dark:text-brand-200': isActive('/search') }"
          :aria-label="$t('common.search')"
          data-testid="nav-search-icon"
        >
          <Icon
            name="ph:magnifying-glass-duotone"
            class="size-5"
          />
        </NuxtLink>

        <nav class="hidden h-9 items-center gap-1 md:flex">
          <NuxtLink
            v-for="link in navLinks"
            :key="link.to"
            :to="localePath(link.to)"
            class="nav-link relative"
            :class="{ 'nav-link-active': isActive(link.to) }"
          >
            {{ $t(link.label) }}
            <span
              v-if="link.to === '/messages' && unreadCount > 0"
              data-testid="messages-unread-badge"
              class="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white"
            >
              {{ unreadCount > 9 ? '9+' : unreadCount }}
            </span>
          </NuxtLink>
        </nav>
      </div>

      <div class="flex h-9 shrink-0 items-center gap-2">
        <div class="flex h-9 items-center rounded-xl border border-stone-200 bg-stone-50 p-0.5 dark:border-stone-700 dark:bg-stone-900">
          <button
            v-for="item in locales"
            :key="item.code"
            type="button"
            class="flex h-full items-center rounded-lg px-2.5 text-xs font-medium transition"
            :class="locale === item.code
              ? 'bg-white text-brand-800 shadow-sm dark:bg-stone-800 dark:text-brand-200'
              : 'text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200'"
            @click="setLocale(item.code)"
          >
            {{ item.code.toUpperCase() }}
          </button>
        </div>

        <button
          type="button"
          class="flex size-9 items-center justify-center rounded-xl border border-stone-200 text-stone-600 transition hover:bg-stone-100 dark:border-stone-700 dark:text-stone-400 dark:hover:bg-stone-800"
          :title="$t('common.theme')"
          @click="toggleTheme"
        >
          <Icon
            :name="colorMode.value === 'dark' ? 'ph:sun-duotone' : 'ph:moon-duotone'"
            class="size-5"
          />
        </button>

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
          class="flex h-9 max-w-[120px] shrink-0 items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-2 text-xs font-medium text-stone-700 transition hover:bg-stone-100 sm:max-w-[140px] sm:px-2.5 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
          :title="$t('common.account')"
        >
          <span class="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-semibold text-brand-800 dark:bg-brand-900 dark:text-brand-200">
            {{ (user?.name ?? user?.phone ?? '?').slice(0, 1).toUpperCase() }}
          </span>
          <span class="hidden truncate sm:inline">{{ user?.name ?? user?.phone }}</span>
        </NuxtLink>

        <button
          type="button"
          class="relative flex size-9 items-center justify-center rounded-xl border border-stone-200 text-stone-600 transition hover:bg-stone-100 md:hidden dark:border-stone-700 dark:text-stone-400 dark:hover:bg-stone-800"
          :aria-label="mobileMenuOpen ? $t('common.closeMenu') : $t('common.menu')"
          :aria-expanded="mobileMenuOpen"
          data-testid="nav-burger"
          @click="toggleMobileMenu"
        >
          <Icon
            :name="mobileMenuOpen ? 'ph:x-bold' : 'ph:list-bold'"
            class="size-5"
          />
          <span
            v-if="unreadCount > 0"
            class="absolute right-1 top-1 size-2 rounded-full bg-red-500"
          />
        </button>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="mobileMenuOpen"
        class="fixed inset-0 z-200 md:hidden"
        data-testid="nav-mobile-menu"
      >
        <button
          type="button"
          class="absolute inset-0 bg-stone-900/40 backdrop-blur-[2px]"
          :aria-label="$t('common.closeMenu')"
          @click="closeMobileMenu"
        />

        <nav
          class="absolute right-0 top-0 flex h-full w-[min(100%,18rem)] flex-col gap-1 border-l border-stone-200 bg-white p-4 shadow-xl dark:border-stone-800 dark:bg-stone-950"
        >
          <NuxtLink
            v-for="link in burgerNavLinks"
            :key="link.to"
            :to="localePath(link.to)"
            class="nav-link relative rounded-xl px-3 py-2.5"
            :class="{ 'nav-link-active': isActive(link.to) }"
            @click="closeMobileMenu"
          >
            {{ $t(link.label) }}
            <span
              v-if="link.to === '/messages' && unreadCount > 0"
              class="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-semibold text-white"
            >
              {{ unreadCount > 9 ? '9+' : unreadCount }}
            </span>
          </NuxtLink>

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
