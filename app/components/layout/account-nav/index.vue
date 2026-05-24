<script setup lang="ts">
import { formatUserDisplayName, formatUserInitials } from '#shared/utils/user-display'
import type { AccountNavLink } from '~/composables/useAccountNavLinks'
import ru from './i18n/ru'
import en from './i18n/en'

const { t } = usePageI18n({ ru, en })
const localePath = useLocalePath()
const route = useRoute()
const { logout } = useAuth()
const { links, user, roleLabelKey } = useAccountNavLinks()

const roleLabel = computed(() =>
  roleLabelKey.value ? t(roleLabelKey.value) : '',
)

const userDisplayName = computed(() =>
  user.value ? formatUserDisplayName(user.value) : '',
)

const userInitials = computed(() => formatUserInitials(user.value?.name))

const linkLabel = (link: AccountNavLink) => t(link.labelKey)

const isActive = (path: string) => {
  const localized = localePath(path)

  if (path === '/account') {
    return route.path === localized
  }

  return route.path === localized || route.path.startsWith(`${localized}/`)
}
</script>

<template>
  <aside
    v-if="user"
    class="w-full lg:sticky lg:top-24 lg:w-56 lg:shrink-0 lg:self-start"
    aria-label="Account navigation"
  >
    <div class="surface-card mb-4 hidden p-4 lg:block">
      <div class="flex items-center gap-3">
        <span class="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-base font-semibold text-brand-800 dark:bg-brand-900 dark:text-brand-200">
          {{ userInitials }}
        </span>
        <div class="min-w-0">
          <p class="truncate text-sm font-semibold text-stone-900 dark:text-stone-50">
            {{ userDisplayName }}
          </p>
          <p
            v-if="roleLabel"
            class="text-xs text-stone-500 dark:text-stone-400"
          >
            {{ roleLabel }}
          </p>
        </div>
      </div>
    </div>

    <nav
      class="mb-4 flex gap-1 overflow-x-auto pb-1 lg:hidden"
      :aria-label="t('navTitle')"
    >
      <NuxtLink
        v-for="link in links"
        :key="link.to"
        :to="localePath(link.to)"
        class="nav-link shrink-0"
        :class="{ 'nav-link-active': isActive(link.to) }"
      >
        <Icon
          :name="link.icon"
          class="size-4 shrink-0"
        />
        {{ linkLabel(link) }}
      </NuxtLink>
    </nav>

    <nav
      class="hidden lg:block"
      :aria-label="t('navTitle')"
    >
      <p class="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
        {{ t('navTitle') }}
      </p>
      <ul class="space-y-0.5">
        <li
          v-for="link in links"
          :key="link.to"
        >
          <NuxtLink
            :to="localePath(link.to)"
            class="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
            :class="isActive(link.to) ? 'bg-brand-50 text-brand-800 dark:bg-brand-950 dark:text-brand-200' : ''"
          >
            <Icon
              :name="link.icon"
              class="size-5 shrink-0"
              :class="isActive(link.to) ? 'text-brand-700 dark:text-brand-400' : 'text-stone-500 dark:text-stone-400'"
            />
            {{ linkLabel(link) }}
          </NuxtLink>
        </li>
      </ul>

      <UiButton
        variant="outline"
        class="mt-6 w-full"
        @click="logout()"
      >
        {{ t('logout') }}
      </UiButton>
    </nav>
  </aside>
</template>
