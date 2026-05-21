<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'host-role'],
})
</script>

<template>
  <div class="flex min-h-screen flex-col bg-stone-50 dark:bg-stone-950">
    <LayoutSettingsBar />
    <LayoutHostNav />
    <main class="flex-1">
      <slot />
    </main>
    <LayoutAppFooter />
    <LegalCookieConsent />
  </div>
</template>
