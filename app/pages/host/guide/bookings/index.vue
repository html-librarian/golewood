<script setup lang="ts">
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({
  layout: 'host',
  middleware: 'auth',
})

const { t, locale } = usePageI18n({ ru, en })
const localePath = useLocalePath()

const sections = computed(() => (locale.value === 'en' ? en.sections : ru.sections))
</script>

<template>
  <HostGuideShell>
    <header class="space-y-3">
      <h1 class="section-title">
        {{ t('title') }}
      </h1>
      <p class="text-stone-600 dark:text-stone-400">
        {{ t('intro') }}
      </p>
      <NuxtLink :to="localePath('/host/bookings')">
        <UiButton>{{ t('cta') }}</UiButton>
      </NuxtLink>
    </header>

    <section
      v-for="(section, index) in sections"
      :key="index"
      class="surface-card space-y-2 p-5"
    >
      <h2 class="font-display text-lg font-semibold text-stone-900 dark:text-stone-50">
        {{ section.title }}
      </h2>
      <p class="text-sm leading-relaxed text-stone-600 dark:text-stone-400">
        {{ section.body }}
      </p>
    </section>
  </HostGuideShell>
</template>
