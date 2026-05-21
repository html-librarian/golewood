<script setup lang="ts">
import { PLATFORM_LEGAL } from '#shared/constants/platform-legal'
import type { HostVerificationModalEmits, HostVerificationModalProps } from './types'

defineProps<HostVerificationModalProps>()
const emit = defineEmits<HostVerificationModalEmits>()

const { locale } = useI18n()

const close = () => {
  emit('update:open', false)
}

const platformLegalName = computed(() =>
  locale.value === 'en' ? PLATFORM_LEGAL.legalName.en : PLATFORM_LEGAL.legalName.ru,
)

const platformAddress = computed(() =>
  locale.value === 'en' ? PLATFORM_LEGAL.legalAddress.en : PLATFORM_LEGAL.legalAddress.ru,
)

const platformHours = computed(() =>
  locale.value === 'en' ? PLATFORM_LEGAL.workingHours.en : PLATFORM_LEGAL.workingHours.ru,
)

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    close()
  }
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      data-testid="host-verification-modal"
    >
      <button
        type="button"
        class="absolute inset-0 bg-stone-900/50 dark:bg-stone-950/70"
        :aria-label="$t('hostVerification.close')"
        @click="close()"
      />

      <article
        class="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-xl dark:bg-stone-900"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="'host-verification-title'"
      >
        <button
          type="button"
          class="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900"
          @click="close()"
        >
          <Icon
            name="ph:x"
            class="size-4"
          />
        </button>

        <header class="space-y-1 pr-10">
          <h2
            id="host-verification-title"
            class="text-xl font-semibold text-stone-900 dark:text-stone-50"
          >
            {{ $t('hostVerification.modalTitle') }}
          </h2>
          <p class="text-sm text-stone-500 dark:text-stone-400">
            {{ $t('hostVerification.modalSubtitle') }}
          </p>
        </header>

        <section
          v-if="verification.legal"
          class="mt-6 space-y-3"
        >
          <h3 class="text-sm font-semibold text-stone-900 dark:text-stone-100">
            {{ $t('hostVerification.hostSection') }}
          </h3>
          <ul class="space-y-2 text-sm text-stone-700 dark:text-stone-300">
            <li>
              <span class="font-medium text-stone-900 dark:text-stone-100">{{ verification.legal.legalName }}</span>
            </li>
            <li v-if="verification.legal.ogrn">
              <span class="font-medium">{{ $t('hostVerification.ogrn') }}:</span>
              {{ verification.legal.ogrn }}
            </li>
            <li>
              <span class="font-medium">{{ $t('hostVerification.inn') }}:</span>
              {{ verification.legal.inn }}
            </li>
            <li>
              <span class="font-medium">{{ $t('hostVerification.address') }}:</span>
              {{ verification.legal.legalAddress }}
            </li>
            <li>
              <span class="font-medium">{{ $t('hostVerification.workingHours') }}:</span>
              {{ verification.legal.workingHoursNote || $t('hostVerification.workingHoursDefault') }}
            </li>
          </ul>
        </section>

        <section class="mt-6 space-y-3 border-t border-stone-200 pt-6 dark:border-stone-800">
          <h3 class="text-sm font-semibold text-stone-900 dark:text-stone-100">
            {{ $t('hostVerification.platformSection') }}
          </h3>
          <ul class="space-y-2 text-sm text-stone-700 dark:text-stone-300">
            <li>
              <span class="font-medium text-stone-900 dark:text-stone-100">{{ platformLegalName }}</span>
            </li>
            <li>
              <span class="font-medium">{{ $t('hostVerification.ogrn') }}:</span>
              {{ PLATFORM_LEGAL.ogrn }}
            </li>
            <li>
              <span class="font-medium">{{ $t('hostVerification.inn') }}:</span>
              {{ PLATFORM_LEGAL.inn }}
            </li>
            <li>
              <span class="font-medium">{{ $t('hostVerification.address') }}:</span>
              {{ platformAddress }}
            </li>
            <li>
              <span class="font-medium">{{ $t('hostVerification.workingHours') }}:</span>
              {{ platformHours }}
            </li>
          </ul>
        </section>
      </article>
    </div>
  </Teleport>
</template>
