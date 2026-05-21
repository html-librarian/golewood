<script setup lang="ts">
import type { HostVerifiedBadgeEmits, HostVerifiedBadgeProps } from './types'

const props = withDefaults(defineProps<HostVerifiedBadgeProps>(), {
  showInfoLink: true,
})

const emit = defineEmits<HostVerifiedBadgeEmits>()
const { locale } = useI18n()

const label = computed(() =>
  locale.value === 'en' ? props.verification.badgeLabel.en : props.verification.badgeLabel.ru,
)

const handleClick = () => {
  if (props.showInfoLink) {
    emit('openDetails')
  }
}
</script>

<template>
  <div
    v-if="verification.isVerified"
    class="flex flex-wrap items-center gap-x-2 gap-y-1"
    data-testid="host-verified-badge"
  >
    <component
      :is="showInfoLink ? 'button' : 'span'"
      :type="showInfoLink ? 'button' : undefined"
      class="inline-flex max-w-full items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[11px] font-semibold leading-tight text-white ring-1 ring-emerald-400/60 transition hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-emerald-400 dark:text-emerald-950 dark:ring-emerald-300/50 dark:hover:bg-emerald-300 dark:focus-visible:ring-offset-stone-900"
      @click="showInfoLink ? handleClick() : undefined"
    >
      <Icon
        name="ph:seal-check-fill"
        class="size-3 shrink-0"
        aria-hidden="true"
      />
      <span class="truncate">{{ label }}</span>
    </component>

    <button
      v-if="showInfoLink"
      type="button"
      class="text-[11px] font-medium text-emerald-700 underline-offset-2 transition hover:text-emerald-800 hover:underline dark:text-emerald-400 dark:hover:text-emerald-300"
      @click="handleClick()"
    >
      {{ $t('hostVerification.providerInfo') }}
    </button>
  </div>
</template>
