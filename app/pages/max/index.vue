<script setup lang="ts">
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({
  layout: 'max',
  middleware: 'max-bridge',
})

const { t } = usePageI18n({ ru, en })
const localePath = useLocalePath()
const {
  needsLink,
  bridgePending,
  bridgeError,
  botDeepLink,
  openExternal,
  mockSignIn,
  isMaxContext,
  platform,
  isMaxHost,
  hapticSelection,
} = useMaxBridge()
const { user } = useAuth()
const { fetchStats } = useHost()
const { fetchGuestBookings } = useBookings()

const showDevMock = import.meta.dev && !isMaxContext.value

const { data: hostStats, refresh: refreshHost } = await useAsyncData('max-host-stats', async () => {
  if (!user.value || needsLink.value || !isMaxHost.value) {
    return null
  }

  return fetchStats()
})

const { data: guestBookings, refresh: refreshGuest } = await useAsyncData('max-guest-bookings-preview', async () => {
  if (!user.value || needsLink.value || isMaxHost.value) {
    return null
  }

  return fetchGuestBookings()
})

const guestUpcomingCount = computed(() =>
  (guestBookings.value ?? []).filter(booking => ['pending', 'confirmed'].includes(booking.status)).length,
)

watch(user, () => {
  void refreshHost()
  void refreshGuest()
})

const accountUrl = computed(() => needsLink.value?.accountUrl ?? localePath('/account'))

const pageTitle = computed(() => (isMaxHost.value ? t('titleHost') : t('titleGuest')))
const pageSubtitle = computed(() => (isMaxHost.value ? t('subtitleHost') : t('subtitleGuest')))

const handleOpenAccount = () => {
  hapticSelection()
  openExternal(accountUrl.value.startsWith('http') ? accountUrl.value : `${window.location.origin}${accountUrl.value}`)
}

const handleMock = async () => {
  await mockSignIn()
  await refreshHost()
  await refreshGuest()
}
</script>

<template>
  <div class="mx-auto max-w-md space-y-6">
    <div>
      <h1 class="font-display text-2xl font-semibold">
        {{ pageTitle }}
      </h1>
      <p class="mt-1 text-sm text-stone-600 dark:text-stone-400">
        {{ pageSubtitle }}
        <span
          v-if="platform"
          class="text-stone-500"
        > · {{ platform }}</span>
      </p>
    </div>

    <p
      v-if="bridgePending"
      class="text-sm text-stone-600 dark:text-stone-400"
    >
      {{ t('loading') }}
    </p>

    <p
      v-else-if="bridgeError"
      class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
    >
      {{ t('bridgeError') }}
    </p>

    <section
      v-if="needsLink"
      class="surface-card space-y-4 p-4"
    >
      <h2 class="text-lg font-semibold">
        {{ t('needsLinkTitle') }}
      </h2>
      <p class="text-sm text-stone-600 dark:text-stone-400">
        {{ t('needsLinkBody') }}
      </p>
      <div class="flex flex-col gap-2">
        <UiButton
          variant="primary"
          @click="handleOpenAccount"
        >
          {{ t('openAccount') }}
        </UiButton>
        <UiButton
          v-if="botDeepLink"
          variant="secondary"
          @click="openExternal(botDeepLink)"
        >
          {{ t('openBot') }}
        </UiButton>
        <UiButton
          v-if="showDevMock"
          variant="ghost"
          @click="handleMock"
        >
          {{ t('devMock') }}
        </UiButton>
      </div>
    </section>

    <template v-else-if="user && isMaxHost && hostStats">
      <div class="grid grid-cols-2 gap-3">
        <article class="surface-card p-4">
          <p class="text-xs text-stone-500 dark:text-stone-400">
            {{ t('statPending') }}
          </p>
          <p class="mt-1 text-2xl font-semibold text-accent-600 dark:text-accent-400">
            {{ hostStats.bookingsPending }}
          </p>
        </article>
        <article class="surface-card p-4">
          <p class="text-xs text-stone-500 dark:text-stone-400">
            {{ t('statUpcoming') }}
          </p>
          <p class="mt-1 text-2xl font-semibold text-teal-700 dark:text-teal-400">
            {{ hostStats.bookingsUpcoming }}
          </p>
        </article>
      </div>

      <nav class="flex flex-col gap-2">
        <NuxtLink
          :to="localePath('/max/bookings')"
          class="surface-card flex items-center justify-between px-4 py-3 font-medium hover:bg-stone-100 dark:hover:bg-stone-900"
          @click="hapticSelection()"
        >
          {{ t('navBookings') }}
          <Icon
            name="ph:caret-right"
            class="size-5 text-stone-400"
          />
        </NuxtLink>
        <button
          type="button"
          class="surface-card flex items-center justify-between px-4 py-3 text-left font-medium hover:bg-stone-100 dark:hover:bg-stone-900"
          @click="openExternal(localePath('/messages'))"
        >
          {{ t('navMessages') }}
          <Icon
            name="ph:caret-right"
            class="size-5 text-stone-400"
          />
        </button>
        <button
          type="button"
          class="surface-card flex items-center justify-between px-4 py-3 text-left font-medium hover:bg-stone-100 dark:hover:bg-stone-900"
          @click="openExternal(localePath('/host'))"
        >
          {{ t('navSiteHost') }}
          <Icon
            name="ph:arrow-square-out"
            class="size-5 text-stone-400"
          />
        </button>
      </nav>
    </template>

    <template v-else-if="user && !isMaxHost">
      <article class="surface-card p-4">
        <p class="text-xs text-stone-500 dark:text-stone-400">
          {{ t('guestUpcoming') }}
        </p>
        <p class="mt-1 text-2xl font-semibold text-teal-700 dark:text-teal-400">
          {{ guestUpcomingCount }}
        </p>
      </article>

      <nav class="flex flex-col gap-2">
        <NuxtLink
          :to="localePath('/max/bookings')"
          class="surface-card flex items-center justify-between px-4 py-3 font-medium hover:bg-stone-100 dark:hover:bg-stone-900"
          @click="hapticSelection()"
        >
          {{ t('navGuestBookings') }}
          <Icon
            name="ph:caret-right"
            class="size-5 text-stone-400"
          />
        </NuxtLink>
        <button
          type="button"
          class="surface-card flex items-center justify-between px-4 py-3 text-left font-medium hover:bg-stone-100 dark:hover:bg-stone-900"
          @click="openExternal(localePath('/messages'))"
        >
          {{ t('navMessages') }}
          <Icon
            name="ph:caret-right"
            class="size-5 text-stone-400"
          />
        </button>
        <button
          type="button"
          class="surface-card flex items-center justify-between px-4 py-3 text-left font-medium hover:bg-stone-100 dark:hover:bg-stone-900"
          @click="openExternal(localePath('/bookings'))"
        >
          {{ t('navSiteGuest') }}
          <Icon
            name="ph:arrow-square-out"
            class="size-5 text-stone-400"
          />
        </button>
      </nav>
    </template>
  </div>
</template>
