<script setup lang="ts"></script>

<template>
  <div class="flex min-h-screen flex-col bg-stone-50 dark:bg-stone-950 lg:flex-row">
    <aside class="hidden w-56 shrink-0 border-r border-stone-200/80 bg-white dark:border-stone-800 dark:bg-stone-900 lg:flex lg:flex-col">
      <div class="border-b border-stone-200/80 px-4 py-4 dark:border-stone-800">
        <NuxtLink
          to="/admin"
          class="font-display text-sm font-semibold text-brand-800 dark:text-brand-200"
        >
          Golewood Admin
        </NuxtLink>
      </div>
      <AdminNav variant="sidebar" />
    </aside>

    <div class="flex min-h-screen min-w-0 flex-1 flex-col">
      <LayoutSettingsBar />
      <AdminNav
        variant="horizontal"
        class="lg:hidden"
      />
      <main class="flex-1">
        <slot />
      </main>
      <LayoutAppFooter />
      <LegalCookieConsent />
    </div>
  </div>
</template>
