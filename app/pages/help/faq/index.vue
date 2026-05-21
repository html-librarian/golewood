<script setup lang="ts">
import ru from './i18n/ru'
import en from './i18n/en'

const { t, locale } = usePageI18n({ ru, en })

useSiteSeo({
  title: t('title'),
  description: t('intro'),
})

const items = computed(() => (locale.value === 'en' ? en.items : ru.items))
</script>

<template>
  <div class="page-container py-8">
    <div class="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
      <HelpNav class="lg:sticky lg:top-32 lg:self-start" />

      <article class="space-y-6">
        <header class="space-y-2">
          <h1 class="section-title">
            {{ t('title') }}
          </h1>
          <p class="text-stone-600 dark:text-stone-400">
            {{ t('intro') }}
          </p>
        </header>

        <dl class="space-y-4">
          <div
            v-for="(item, index) in items"
            :key="index"
            class="surface-card p-5"
          >
            <dt class="font-semibold text-stone-900 dark:text-stone-50">
              {{ item.q }}
            </dt>
            <dd class="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
              {{ item.a }}
            </dd>
          </div>
        </dl>
      </article>
    </div>
  </div>
</template>
