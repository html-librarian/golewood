<script setup lang="ts">
const localePath = useLocalePath()
const { t } = useI18n()
</script>

<template>
  <p class="legal-meta text-center text-xs leading-relaxed">
    {{ t('legalConsent.prefix') }}
    <NuxtLink
      :to="localePath('/legal/terms')"
      class="legal-link"
    >
      {{ t('legal.nav.terms') }}
    </NuxtLink>
    {{ t('legalConsent.and') }}
    <NuxtLink
      :to="localePath('/legal/privacy')"
      class="legal-link"
    >
      {{ t('legal.nav.privacy') }}
    </NuxtLink>
    {{ t('legalConsent.suffix') }}
  </p>
</template>
