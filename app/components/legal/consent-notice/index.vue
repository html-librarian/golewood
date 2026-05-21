<script setup lang="ts">
const localePath = useLocalePath()
const { t } = useI18n()
</script>

<template>
  <p class="text-center text-xs leading-relaxed text-stone-500 dark:text-stone-400">
    {{ t('legalConsent.prefix') }}
    <NuxtLink
      :to="localePath('/legal/terms')"
      class="text-brand-700 underline underline-offset-2 hover:text-brand-800 dark:text-brand-300"
    >
      {{ t('legal.nav.terms') }}
    </NuxtLink>
    {{ t('legalConsent.and') }}
    <NuxtLink
      :to="localePath('/legal/privacy')"
      class="text-brand-700 underline underline-offset-2 hover:text-brand-800 dark:text-brand-300"
    >
      {{ t('legal.nav.privacy') }}
    </NuxtLink>
    {{ t('legalConsent.suffix') }}
  </p>
</template>
