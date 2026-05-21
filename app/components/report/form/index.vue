<script setup lang="ts">
import type { ReportFormEmits, ReportFormProps } from './types'

withDefaults(defineProps<ReportFormProps>(), {
  loading: false,
})

const emit = defineEmits<ReportFormEmits>()

const reason = ref('')
const error = ref('')

const handleSubmit = () => {
  error.value = ''

  if (reason.value.trim().length < 10) {
    error.value = 'Reason must be at least 10 characters'
    return
  }

  emit('submit', reason.value.trim())
}
</script>

<template>
  <form
    class="surface-card space-y-4 p-5"
    @submit.prevent="handleSubmit()"
  >
    <FormTextarea
      v-model="reason"
      :label="$t('report.reason')"
      :rows="4"
      required
    />

    <p
      v-if="error"
      class="text-sm text-red-600 dark:text-red-400"
    >
      {{ error }}
    </p>

    <UiButton
      type="submit"
      variant="secondary"
      :loading="loading"
    >
      {{ $t('report.submit') }}
    </UiButton>
  </form>
</template>
