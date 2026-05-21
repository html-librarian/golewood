<script setup lang="ts">
import ru from './i18n/ru'
import en from './i18n/en'

const { t, locale } = usePageI18n({ ru, en })

useSiteSeo({
  title: t('title'),
  description: t('intro'),
})

const sections = computed(() => (locale.value === 'en' ? en.sections : ru.sections))
</script>

<template>
  <div class="page-container py-8">
    <div class="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
      <LegalNav class="lg:sticky lg:top-32 lg:self-start" />

      <LegalDocument
        :title="t('title')"
        :updated="t('updated')"
        :intro="t('intro')"
        :sections="sections"
      />
    </div>
  </div>
</template>
