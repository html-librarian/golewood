<script setup lang="ts">
import ru from './i18n/ru'
import en from './i18n/en'

const { t, locale } = usePageI18n({ ru, en })
const localePath = useLocalePath()

useSiteSeo({
  title: t('title'),
  description: t('intro'),
})

const steps = computed(() => (locale.value === 'en' ? en.steps : ru.steps))
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

        <ol class="space-y-4">
          <li
            v-for="(step, index) in steps"
            :key="index"
            class="surface-card flex gap-4 p-5"
          >
            <span class="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-800 dark:bg-brand-950 dark:text-brand-200">
              {{ index + 1 }}
            </span>
            <div class="space-y-1">
              <h2 class="font-semibold text-stone-900 dark:text-stone-50">
                {{ step.title }}
              </h2>
              <p class="text-sm leading-relaxed text-stone-600 dark:text-stone-400">
                {{ step.body }}
              </p>
            </div>
          </li>
        </ol>
      </article>
    </div>
  </div>
</template>
