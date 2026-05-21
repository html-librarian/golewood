<script setup lang="ts">
const { locale } = useI18n()

useHead({
  htmlAttrs: {
    lang: () => locale.value,
  },
})
</script>

<template>
  <div class="flex min-h-screen flex-col bg-stone-50 dark:bg-stone-950">
    <LayoutSettingsBar />
    <main class="mobile-nav-offset flex-1">
      <slot />
    </main>
    <LayoutAppFooter />
    <LayoutMobileNav />
    <LegalCookieConsent />
  </div>
</template>
