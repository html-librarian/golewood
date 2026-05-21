<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const { showBanner, accept } = useCookieConsent()

const handleAccept = () => {
  accept()
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="showBanner"
      role="dialog"
      aria-live="polite"
      aria-label="Cookie notice"
      class="fixed inset-x-0 bottom-0 z-60 border-t border-stone-200 bg-white/95 p-4 shadow-lg backdrop-blur-sm dark:border-stone-700 dark:bg-stone-900/95 md:bottom-4 md:inset-x-4 md:rounded-2xl md:border"
      data-testid="cookie-consent-banner"
    >
      <div class="layout-container flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p class="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          {{ t('cookieConsent.message') }}
          <NuxtLink
            :to="localePath('/legal/privacy')"
            class="font-medium text-brand-700 underline underline-offset-2 hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200"
          >
            {{ t('cookieConsent.privacyLink') }}
          </NuxtLink>
        </p>
        <UiButton
          class="shrink-0"
          size="sm"
          @click="handleAccept"
        >
          {{ t('cookieConsent.accept') }}
        </UiButton>
      </div>
    </div>
  </Teleport>
</template>
