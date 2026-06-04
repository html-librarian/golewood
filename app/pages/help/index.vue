<script setup lang="ts">
import { staggerDelayMs } from '#shared/utils/stagger-delay'
import ru from './i18n/ru'
import en from './i18n/en'

const { t } = usePageI18n({ ru, en })
const localePath = useLocalePath()

useSiteSeo({
  title: t('title'),
  description: t('subtitle'),
})

const cards = computed(() => [
  {
    to: '/help/faq',
    icon: 'ph:question-duotone',
    title: t('cards.faq.title'),
    description: t('cards.faq.description'),
  },
  {
    to: '/help/become-host',
    icon: 'ph:house-line-duotone',
    title: t('cards.becomeHost.title'),
    description: t('cards.becomeHost.description'),
  },
  {
    to: '/help/create-listing',
    icon: 'ph:plus-circle-duotone',
    title: t('cards.createListing.title'),
    description: t('cards.createListing.description'),
  },
  {
    to: '/help/support',
    icon: 'ph:headset-duotone',
    title: t('cards.support.title'),
    description: t('cards.support.description'),
  },
])
</script>

<template>
  <div class="page-container py-8">
    <div class="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
      <HelpNav class="lg:sticky lg:top-32 lg:self-start" />

      <div class="space-y-8">
        <header class="space-y-2">
          <h1 class="section-title section-title-accent">
            {{ t('title') }}
          </h1>
          <p class="section-subtitle max-w-2xl">
            {{ t('subtitle') }}
          </p>
        </header>

        <UiReveal>
          <div class="grid gap-4 sm:grid-cols-2">
            <NuxtLink
              v-for="(card, index) in cards"
              :key="card.to"
              :to="localePath(card.to)"
              class="reveal-stagger-item surface-card-interactive group relative flex flex-col gap-3 overflow-hidden p-5"
              :style="{ transitionDelay: `${staggerDelayMs(index, 55, 220)}ms` }"
            >
              <span
                class="card-crown"
                aria-hidden="true"
              />
              <Icon
                :name="card.icon"
                class="size-8 text-brand-600 transition group-hover:scale-105 dark:text-brand-400"
              />
              <h2 class="font-display text-lg font-semibold text-stone-900 group-hover:text-brand-800 dark:text-stone-50 dark:group-hover:text-brand-200">
                {{ card.title }}
              </h2>
              <p class="text-sm text-stone-600 dark:text-stone-400">
                {{ card.description }}
              </p>
            </NuxtLink>
          </div>
        </UiReveal>
      </div>
    </div>
  </div>
</template>
