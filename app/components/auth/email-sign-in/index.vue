<script setup lang="ts">
import type { AuthEmailSignInProps } from './types'

const props = defineProps<AuthEmailSignInProps>()

const emit = defineEmits<{
  success: []
}>()

const { sendEmailCode, verifyEmailCode } = useAuth()

const name = ref('')
const phone = ref('')
const email = ref('')
const linkPhone = ref('')
const showPhoneLink = ref(false)
const code = ref('')
const step = ref<'email' | 'code'>('email')
const loading = ref(false)
const error = ref('')
const devCode = ref<string | null>(null)
const devMagicUrl = ref<string | null>(null)

const handleSendCode = async () => {
  loading.value = true
  error.value = ''

  try {
    const result = await sendEmailCode(email.value)
    devCode.value = 'devCode' in result ? String(result.devCode) : null
    devMagicUrl.value = 'devMagicUrl' in result ? String(result.devMagicUrl) : null
    step.value = 'code'
  } catch {
    error.value = props.labels.errorSendCode
  } finally {
    loading.value = false
  }
}

const handleVerify = async () => {
  loading.value = true
  error.value = ''

  try {
    await verifyEmailCode({
      email: email.value,
      code: code.value,
      name: props.registerMode ? name.value : undefined,
      phone: props.registerMode ? phone.value : undefined,
      linkPhone: props.allowPhoneLink && showPhoneLink.value && linkPhone.value
        ? linkPhone.value
        : undefined,
    })
    emit('success')
  } catch (err: unknown) {
    const status = err && typeof err === 'object' && 'statusCode' in err
      ? (err as { statusCode: number }).statusCode
      : undefined

    error.value = status === 409 && props.labels.errorConflict
      ? props.labels.errorConflict
      : props.labels.errorInvalidCode
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <form
    data-testid="auth-email-form"
    class="flex flex-col gap-4"
    @submit.prevent="step === 'email' ? handleSendCode() : handleVerify()"
  >
    <FormInput
      v-if="registerMode && step === 'email'"
      v-model="name"
      :label="labels.nameLabel ?? ''"
      autocomplete="name"
      required
    />

    <FormPhoneInput
      v-if="registerMode && step === 'email'"
      v-model="phone"
      :label="labels.phoneLabel ?? ''"
      required
    />

    <template v-if="allowPhoneLink && step === 'email' && !registerMode">
      <button
        type="button"
        class="text-left text-sm font-medium text-brand-700 dark:text-brand-400"
        @click="showPhoneLink = !showPhoneLink"
      >
        {{ labels.linkPhoneHint }}
      </button>
      <FormPhoneInput
        v-if="showPhoneLink"
        v-model="linkPhone"
        :label="labels.phoneLabel ?? ''"
      />
    </template>

    <FormInput
      v-model="email"
      :label="labels.emailLabel"
      type="email"
      autocomplete="email"
      :disabled="step === 'code' || loading"
      :error="step === 'email' ? error : undefined"
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
    <p
      v-if="devMagicUrl"
      class="break-all rounded-lg bg-stone-100 px-3 py-2 text-xs text-stone-700 dark:bg-stone-800 dark:text-stone-300"
    >
      <a
        :href="devMagicUrl"
        class="font-medium text-brand-700 dark:text-brand-400"
      >{{ devMagicUrl }}</a>
    </p>

    <UiButton
      type="submit"
      size="lg"
      class="w-full"
      :loading="loading"
    >
      {{ step === 'email' ? labels.sendCode : labels.submit }}
    </UiButton>
  </form>
</template>
