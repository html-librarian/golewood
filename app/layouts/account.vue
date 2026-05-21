<script setup lang="ts"></script>

<template>
  <div class="flex min-h-screen flex-col bg-stone-50 dark:bg-stone-950">
    <LayoutSettingsBar />
    <div class="flex-1">
      <div class="page-container flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
        <LayoutAccountNav />
        <main class="min-w-0 flex-1">
          <slot />
        </main>
      </div>
    </div>
    <LayoutAppFooter />
    <LegalCookieConsent />
  </div>
</template>
