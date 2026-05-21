<script setup lang="ts">
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({
  layout: 'host',
  middleware: 'auth',
})

const { t } = usePageI18n({ ru, en })
const localePath = useLocalePath()

const cards = computed(() => [
  { to: '/host/guide/listings', title: t('cards.listings.title'), description: t('cards.listings.description'), icon: 'ph:house-line-duotone' },
  { to: '/host/guide/bookings', title: t('cards.bookings.title'), description: t('cards.bookings.description'), icon: 'ph:calendar-check-duotone' },
  { to: '/host/guide/calendar', title: t('cards.calendar.title'), description: t('cards.calendar.description'), icon: 'ph:calendar-duotone' },
  { to: '/host/guide/messages', title: t('cards.messages.title'), description: t('cards.messages.description'), icon: 'ph:chats-duotone' },
  { to: '/host/guide/promo', title: t('cards.promo.title'), description: t('cards.promo.description'), icon: 'ph:megaphone-duotone' },
])
</script>

<template>
  <HostGuideShell>
    <header class="space-y-2">
      <h1 class="section-title">
        {{ t('title') }}
      </h1>
      <p class="max-w-2xl text-stone-600 dark:text-stone-400">
        {{ t('subtitle') }}
      </p>
    </header>

    <div class="grid gap-4 sm:grid-cols-2">
      <NuxtLink
        v-for="card in cards"
        :key="card.to"
        :to="localePath(card.to)"
        class="surface-card group flex gap-4 p-5 transition hover:border-brand-300 hover:shadow-(--shadow-card-hover) dark:hover:border-brand-700"
      >
        <Icon
          :name="card.icon"
          class="size-8 shrink-0 text-brand-600 dark:text-brand-400"
        />
        <div class="space-y-1">
          <h2 class="font-display text-lg font-semibold text-stone-900 group-hover:text-brand-800 dark:text-stone-50 dark:group-hover:text-brand-200">
            {{ card.title }}
          </h2>
          <p class="text-sm text-stone-600 dark:text-stone-400">
            {{ card.description }}
          </p>
        </div>
      </NuxtLink>
    </div>

    <section class="surface-card space-y-2 p-5">
      <h2 class="font-display text-lg font-semibold text-stone-900 dark:text-stone-50">
        {{ t('publicHelp') }}
      </h2>
      <p class="text-sm text-stone-600 dark:text-stone-400">
        {{ t('publicHelpHint') }}
      </p>
      <NuxtLink
        :to="localePath('/help')"
        class="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline dark:text-brand-400"
      >
        {{ $t('footer.help') }}
        <Icon
          name="ph:arrow-right"
          class="size-4"
        />
      </NuxtLink>
    </section>
  </HostGuideShell>
</template>
