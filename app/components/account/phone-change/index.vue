<script setup lang="ts">
import { isPlaceholderPhone } from '#shared/utils/synthetic-phone-detect'
import type { PhoneChangeStatus } from '#shared/types/account-phone'
import type { AccountPhoneChangeProps } from './types'

const props = withDefaults(defineProps<AccountPhoneChangeProps>(), {
  verifyViaEmail: false,
})

const {
  fetchChangeStatus,
  sendOldPhoneCode,
  verifyOldPhoneCode,
  sendChangeCode,
  verifyChangeCode,
} = useAccountPhone()
const { phoneAuthEnabled } = useAuthFeatures()

const phone = ref('')
const code = ref('')
const currentCode = ref('')
const step = ref<'current' | 'phone' | 'code'>('phone')
const loading = ref(false)
const statusLoading = ref(true)
const error = ref('')
const devCode = ref<string | null>(null)
const changeStatus = ref<PhoneChangeStatus | null>(null)

const showPlaceholderHint = computed(() => isPlaceholderPhone(props.currentPhone))

const canChangePhone = computed(() => phoneAuthEnabled.value || props.verifyViaEmail)

const maskedCurrentPhone = computed(
  () => changeStatus.value?.maskedCurrentPhone ?? null,
)

const applyStepFromStatus = (status: PhoneChangeStatus) => {
  if (status.requiresCurrentPhoneVerification && !status.currentPhoneVerified) {
    step.value = 'current'
    return
  }

  step.value = 'phone'
}

const loadChangeStatus = async () => {
  statusLoading.value = true

  try {
    const status = await fetchChangeStatus()
    changeStatus.value = status
    applyStepFromStatus(status)
  } catch {
    changeStatus.value = null
    step.value = 'phone'
  } finally {
    statusLoading.value = false
  }
}

onMounted(() => {
  void loadChangeStatus()
})

const currentSubtitleText = computed(() => {
  if (!maskedCurrentPhone.value) {
    return props.labels.currentSubtitle
  }

  return props.labels.currentSubtitle.replace('{masked}', maskedCurrentPhone.value)
})

const handleSendCurrentCode = async () => {
  loading.value = true
  error.value = ''
  devCode.value = null

  try {
    const result = await sendOldPhoneCode()
    devCode.value = 'devCode' in result ? String(result.devCode) : null
  } catch {
    error.value = props.labels.errorSendCode
  } finally {
    loading.value = false
  }
}

const handleVerifyCurrent = async () => {
  loading.value = true
  error.value = ''

  try {
    await verifyOldPhoneCode(currentCode.value)
    currentCode.value = ''
    devCode.value = null
    await loadChangeStatus()
    step.value = 'phone'
  } catch {
    error.value = props.labels.errorInvalidCode
  } finally {
    loading.value = false
  }
}

const handleSendCode = async () => {
  loading.value = true
  error.value = ''

  try {
    const result = await sendChangeCode(phone.value)
    devCode.value = 'devCode' in result ? String(result.devCode) : null
    step.value = 'code'
  } catch (err: unknown) {
    const status = err && typeof err === 'object' && 'statusCode' in err
      ? (err as { statusCode: number }).statusCode
      : undefined

    if (status === 403) {
      error.value = props.labels.errorNeedCurrent
      await loadChangeStatus()
      return
    }

    error.value = status === 409 ? props.labels.errorConflict : props.labels.errorSendCode
  } finally {
    loading.value = false
  }
}

const handleVerify = async () => {
  loading.value = true
  error.value = ''

  try {
    await verifyChangeCode(phone.value, code.value)
    phone.value = ''
    code.value = ''
    devCode.value = null
    await loadChangeStatus()
  } catch {
    error.value = props.labels.errorInvalidCode
  } finally {
    loading.value = false
  }
}

const handleSubmit = () => {
  if (step.value === 'current') {
    return currentCode.value ? handleVerifyCurrent() : handleSendCurrentCode()
  }

  if (step.value === 'phone') {
    return handleSendCode()
  }

  return handleVerify()
}

const submitLabel = computed(() => {
  if (step.value === 'current') {
    return currentCode.value ? props.labels.verifyCurrentCode : props.labels.sendCurrentCode
  }

  return step.value === 'phone' ? props.labels.sendCode : props.labels.submit
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
      <p
        v-if="showPlaceholderHint"
        class="mt-2 text-sm text-brand-800 dark:text-brand-200"
      >
        {{ labels.syntheticHint }}
      </p>
      <p
        v-else-if="verifyViaEmail"
        class="mt-2 text-sm text-stone-600 dark:text-stone-400"
      >
        {{ labels.emailCodeHint }}
      </p>
    </div>

    <p
      v-if="!canChangePhone"
      class="text-sm text-stone-600 dark:text-stone-400"
    >
      {{ labels.smsDisabled }}
    </p>

    <p
      v-else-if="statusLoading"
      class="text-sm text-stone-600 dark:text-stone-400"
    >
      …
    </p>

    <form
      v-else
      class="flex flex-col gap-4"
      @submit.prevent="handleSubmit()"
    >
      <template v-if="step === 'current'">
        <p class="text-sm text-stone-600 dark:text-stone-400">
          {{ currentSubtitleText }}
        </p>

        <FormInput
          v-model="currentCode"
          :label="labels.currentCodeLabel"
          maxlength="4"
          autocomplete="one-time-code"
          :disabled="loading"
          :error="error"
        />
      </template>

      <FormPhoneInput
        v-if="step === 'phone' || step === 'code'"
        v-model="phone"
        :label="labels.phoneLabel"
        :disabled="step === 'code' || loading"
        :error="step === 'phone' ? error : undefined"
      />

      <FormInput
        v-if="step === 'code'"
        v-model="code"
        :label="labels.codeLabel"
        maxlength="4"
        autocomplete="one-time-code"
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
  </section>
</template>
