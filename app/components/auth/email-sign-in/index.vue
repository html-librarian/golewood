<script setup lang="ts">
import type { AuthEmailSignInProps } from './types'

const props = defineProps<AuthEmailSignInProps>()

const emit = defineEmits<{
  success: []
}>()

const { t: $t } = useI18n()
const { sendEmailCode, verifyEmailCode } = useAuth()

const lastName = ref('')
const firstName = ref('')
const patronymic = ref('')
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
      lastName: props.registerMode ? lastName.value : undefined,
      firstName: props.registerMode ? firstName.value : undefined,
      patronymic: props.registerMode && patronymic.value ? patronymic.value : undefined,
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
    <FormUserName
      v-if="registerMode && step === 'email'"
      v-model:last-name="lastName"
      v-model:first-name="firstName"
      v-model:patronymic="patronymic"
      :last-name-label="$t('common.lastName')"
      :first-name-label="$t('common.firstName')"
      :patronymic-label="$t('common.patronymic')"
      :patronymic-optional-hint="$t('common.patronymicOptional')"
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
      type="email"
      :label="labels.emailLabel"
      autocomplete="email"
      :disabled="step === 'code' || loading"
      required
    />

    <FormInput
      v-if="step === 'code'"
      v-model="code"
      :label="labels.codeLabel"
      maxlength="4"
      autocomplete="one-time-code"
      :error="error"
      required
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
        class="text-brand-700 underline dark:text-brand-300"
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
