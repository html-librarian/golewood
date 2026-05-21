<script setup lang="ts">
const localePath = useLocalePath()
</script>

<template>
  <footer class="mt-auto border-t border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
    <div class="layout-container flex flex-col gap-8 py-10 lg:flex-row lg:justify-between">
      <div class="space-y-2">
        <p class="font-display text-lg font-semibold text-stone-900 dark:text-stone-50">
          Golewood
        </p>
        <p class="max-w-sm text-sm text-stone-600 dark:text-stone-400">
          {{ $t('footer.tagline') }}
        </p>
      </div>

      <div class="grid gap-8 sm:grid-cols-2 md:grid-cols-3">
        <div class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
            {{ $t('footer.help') }}
          </p>
          <div class="flex flex-col gap-1.5 text-sm">
            <NuxtLink
              :to="localePath('/help')"
              class="text-stone-600 transition hover:text-brand-700 dark:text-stone-400 dark:hover:text-brand-300"
            >
              {{ $t('help.nav.overview') }}
            </NuxtLink>
            <NuxtLink
              :to="localePath('/help/faq')"
              class="text-stone-600 transition hover:text-brand-700 dark:text-stone-400 dark:hover:text-brand-300"
            >
              {{ $t('help.nav.faq') }}
            </NuxtLink>
            <NuxtLink
              :to="localePath('/help/support')"
              class="text-stone-600 transition hover:text-brand-700 dark:text-stone-400 dark:hover:text-brand-300"
            >
              {{ $t('help.nav.support') }}
            </NuxtLink>
          </div>
        </div>

        <div class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
            {{ $t('footer.legal') }}
          </p>
          <div class="flex flex-col gap-1.5 text-sm">
            <NuxtLink
              :to="localePath('/legal/requisites')"
              class="text-stone-600 transition hover:text-brand-700 dark:text-stone-400 dark:hover:text-brand-300"
            >
              {{ $t('legal.nav.requisites') }}
            </NuxtLink>
            <NuxtLink
              :to="localePath('/legal/offer')"
              class="text-stone-600 transition hover:text-brand-700 dark:text-stone-400 dark:hover:text-brand-300"
            >
              {{ $t('legal.nav.offer') }}
            </NuxtLink>
            <NuxtLink
              :to="localePath('/legal/privacy')"
              class="text-stone-600 transition hover:text-brand-700 dark:text-stone-400 dark:hover:text-brand-300"
            >
              {{ $t('legal.nav.privacy') }}
            </NuxtLink>
            <NuxtLink
              :to="localePath('/legal/terms')"
              class="text-stone-600 transition hover:text-brand-700 dark:text-stone-400 dark:hover:text-brand-300"
            >
              {{ $t('legal.nav.terms') }}
            </NuxtLink>
          </div>
        </div>

        <div class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
            {{ $t('footer.service') }}
          </p>
          <div class="flex flex-col gap-1.5 text-sm">
            <NuxtLink
              :to="localePath('/search')"
              class="text-stone-600 transition hover:text-brand-700 dark:text-stone-400 dark:hover:text-brand-300"
            >
              {{ $t('common.search') }}
            </NuxtLink>
            <NuxtLink
              :to="localePath('/auth/login')"
              class="text-stone-600 transition hover:text-brand-700 dark:text-stone-400 dark:hover:text-brand-300"
            >
              {{ $t('common.login') }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <div class="border-t border-stone-100 px-4 py-4 text-center text-xs text-stone-500 dark:border-stone-800 dark:text-stone-500">
      © {{ new Date().getFullYear() }} Golewood
    </div>
  </footer>
</template>
