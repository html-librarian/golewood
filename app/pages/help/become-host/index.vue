<script setup lang="ts">
import ru from './i18n/ru'
import en from './i18n/en'

const { t, locale } = usePageI18n({ ru, en })
const localePath = useLocalePath()

useSiteSeo({
  title: t('title'),
  description: t('intro'),
})

const sections = computed(() => (locale.value === 'en' ? en.sections : ru.sections))
</script>

<template>
  <div class="page-container py-8">
    <div class="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
      <HelpNav class="lg:sticky lg:top-32 lg:self-start" />

      <article class="space-y-6">
        <header class="space-y-3">
          <h1 class="section-title">
            {{ t('title') }}
          </h1>
          <p class="text-stone-600 dark:text-stone-400">
            {{ t('intro') }}
          </p>
          <NuxtLink :to="localePath('/host/listings/create')">
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
      </article>
    </div>
  </div>
</template>
