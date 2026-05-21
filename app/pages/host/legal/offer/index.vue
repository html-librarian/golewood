<script setup lang="ts">
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({
  layout: 'host',
  middleware: 'auth',
  pageTransition: false,
})

const { t, locale } = usePageI18n({ ru, en })
const localePath = useLocalePath()

const sections = computed(() => (locale.value === 'en' ? en.sections : ru.sections))
</script>

<template>
  <div class="page-container max-w-2xl space-y-6">
    <header class="space-y-1">
      <h1 class="section-title">
        {{ t('title') }}
      </h1>
      <p class="text-sm text-stone-600 dark:text-stone-400">
        {{ t('updated') }}
      </p>
    </header>

    <section
      v-for="(section, index) in sections"
      :key="index"
      class="surface-card space-y-2 p-5"
    >
      <h2 class="font-display text-lg font-semibold text-stone-900 dark:text-stone-50">
        {{ section.title }}
      </h2>
      <p
        v-for="(paragraph, pIndex) in section.paragraphs"
        :key="pIndex"
        class="text-sm leading-relaxed text-stone-600 dark:text-stone-400"
      >
        {{ paragraph }}
      </p>
    </section>

    <NuxtLink
      :to="localePath('/host/payout')"
      class="inline-block text-sm font-medium text-brand-700 hover:underline dark:text-brand-400"
    >
      {{ t('payoutLink') }}
    </NuxtLink>
  </div>
</template>
