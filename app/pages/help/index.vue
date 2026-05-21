<script setup lang="ts">
import ru from './i18n/ru'
import en from './i18n/en'

const { t } = usePageI18n({ ru, en })
const localePath = useLocalePath()

useSiteSeo({
  title: t('title'),
  description: t('subtitle'),
})

const cards = computed(() => [
  { to: '/help/faq', title: t('cards.faq.title'), description: t('cards.faq.description') },
  { to: '/help/become-host', title: t('cards.becomeHost.title'), description: t('cards.becomeHost.description') },
  { to: '/help/create-listing', title: t('cards.createListing.title'), description: t('cards.createListing.description') },
  { to: '/help/support', title: t('cards.support.title'), description: t('cards.support.description') },
])
</script>

<template>
  <div class="page-container py-8">
    <div class="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
      <HelpNav class="lg:sticky lg:top-32 lg:self-start" />

      <div class="space-y-8">
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
            class="surface-card group flex flex-col gap-2 p-5 transition hover:border-brand-300 hover:shadow-(--shadow-card-hover) dark:hover:border-brand-700"
          >
            <h2 class="font-display text-lg font-semibold text-stone-900 group-hover:text-brand-800 dark:text-stone-50 dark:group-hover:text-brand-200">
              {{ card.title }}
            </h2>
            <p class="text-sm text-stone-600 dark:text-stone-400">
              {{ card.description }}
            </p>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
