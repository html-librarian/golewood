<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()
const { t } = useI18n()
const localePath = useLocalePath()

const message = computed(() =>
  props.error.statusCode === 404 ? t('error.notFound') : t('error.default'),
)

const goHome = () => clearError({ redirect: localePath('/') })
</script>

<template>
  <div class="flex min-h-screen flex-col bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
    <LayoutSettingsBar />
    <div class="mx-auto flex min-h-[60vh] max-w-md flex-1 flex-col items-center justify-center px-4 text-center">
      <p class="font-display text-7xl font-bold text-brand-200 dark:text-brand-900">
        {{ error.statusCode }}
      </p>
      <h1 class="mt-4 font-display text-xl font-semibold text-stone-900 dark:text-stone-50">
        {{ message }}
      </h1>
      <UiButton
        class="mt-8"
        @click="goHome()"
      >
        {{ t('error.home') }}
      </UiButton>
    </div>
    <LayoutAppFooter />
  </div>
</template>
