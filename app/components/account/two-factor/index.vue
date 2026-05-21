<script setup lang="ts">
import type { TwoFactorStatus } from '#shared/types/two-factor'
import type { AccountTwoFactorProps } from './types'

const props = defineProps<AccountTwoFactorProps>()

const {
  fetchStatus,
  sendEnableCode,
  confirmEnable,
  sendDisableCode,
  confirmDisable,
} = useTwoFactor()

const status = ref<TwoFactorStatus | null>(null)
const code = ref('')
const step = ref<'idle' | 'enable-code' | 'disable-code'>('idle')
const loading = ref(false)
const error = ref('')
const devCode = ref<string | null>(null)

const load = async () => {
  loading.value = true
  error.value = ''

  try {
    status.value = await fetchStatus()
  } catch {
    error.value = props.labels.loadError
  } finally {
    loading.value = false
  }
}

const handleSendEnable = async () => {
  loading.value = true
  error.value = ''

  try {
    const result = await sendEnableCode()
    devCode.value = 'devCode' in result ? String(result.devCode) : null
    step.value = 'enable-code'
  } catch {
    error.value = props.labels.errorSendCode
  } finally {
    loading.value = false
  }
}

const handleConfirmEnable = async () => {
  loading.value = true
  error.value = ''

  try {
    status.value = await confirmEnable(code.value)
    code.value = ''
    devCode.value = null
    step.value = 'idle'
  } catch {
    error.value = props.labels.errorInvalidCode
  } finally {
    loading.value = false
  }
}

const handleSendDisable = async () => {
  loading.value = true
  error.value = ''

  try {
    const result = await sendDisableCode()
    devCode.value = 'devCode' in result ? String(result.devCode) : null
    step.value = 'disable-code'
  } catch {
    error.value = props.labels.errorSendCode
  } finally {
    loading.value = false
  }
}

const handleConfirmDisable = async () => {
  loading.value = true
  error.value = ''

  try {
    status.value = await confirmDisable(code.value)
    code.value = ''
    devCode.value = null
    step.value = 'idle'
  } catch {
    error.value = props.labels.errorInvalidCode
  } finally {
    loading.value = false
  }
}

const handleSubmit = () => {
  if (step.value === 'enable-code') {
    return handleConfirmEnable()
  }

  if (step.value === 'disable-code') {
    return handleConfirmDisable()
  }

  if (status.value?.enabled) {
    return handleSendDisable()
  }

  return handleSendEnable()
}

const submitLabel = computed(() => {
  if (step.value === 'enable-code') {
    return props.labels.confirmEnable
  }

  if (step.value === 'disable-code') {
    return props.labels.confirmDisable
  }

  return status.value?.enabled ? props.labels.sendDisableCode : props.labels.sendEnableCode
})

onMounted(() => {
  void load()
})
</script>

<template>
  <section class="surface-card space-y-4 p-5">
    <div>
      <h2 class="text-lg font-semibold text-stone-900 dark:text-stone-100">
        {{ labels.title }}
      </h2>
      <p class="mt-1 text-sm text-stone-600 dark:text-stone-400">
        {{ labels.subtitle }}
      </p>
    </div>

    <p
      v-if="!hasEmail"
      class="text-sm text-brand-800 dark:text-brand-200"
    >
      {{ labels.needEmail }}
    </p>

    <template v-else>
      <p
        v-if="status?.enabled"
        class="text-sm font-medium text-emerald-800 dark:text-emerald-200"
      >
        {{ labels.enabled }}
        <span
          v-if="status.maskedEmail"
          class="font-normal text-stone-600 dark:text-stone-400"
        >({{ status.maskedEmail }})</span>
      </p>
      <p
        v-else-if="status"
        class="text-sm text-stone-600 dark:text-stone-400"
      >
        {{ labels.disabled }}
      </p>

      <form
        v-if="status"
        class="flex flex-col gap-4"
        @submit.prevent="handleSubmit()"
      >
        <FormInput
          v-if="step === 'enable-code' || step === 'disable-code'"
          v-model="code"
          :label="labels.codeLabel"
          maxlength="4"
          autocomplete="one-time-code"
          :disabled="loading"
          :error="error"
        />

        <p
          v-if="devCode"
          class="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800 dark:bg-brand-950 dark:text-brand-200"
        >
          {{ labels.devCode }}: <strong>{{ devCode }}</strong>
        </p>

        <UiButton
          type="submit"
          :loading="loading"
        >
          {{ submitLabel }}
        </UiButton>
      </form>
    </template>
  </section>
</template>
