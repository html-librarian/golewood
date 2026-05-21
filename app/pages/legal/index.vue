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
  { to: '/legal/requisites', title: t('cards.requisites.title'), description: t('cards.requisites.description') },
  { to: '/legal/offer', title: t('cards.offer.title'), description: t('cards.offer.description') },
  { to: '/legal/privacy', title: t('cards.privacy.title'), description: t('cards.privacy.description') },
  { to: '/legal/terms', title: t('cards.terms.title'), description: t('cards.terms.description') },
])
</script>

<template>
  <div class="page-container py-8">
    <div class="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
      <LegalNav class="lg:sticky lg:top-32 lg:self-start" />

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
