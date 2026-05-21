<script setup lang="ts">
import type { AccountEmailLinkProps } from './types'

const props = defineProps<AccountEmailLinkProps>()

const { sendLinkCode, verifyLinkCode, unlinkEmail } = useAccountEmail()

const email = ref('')
const code = ref('')
const step = ref<'email' | 'code'>('email')
const loading = ref(false)
const error = ref('')
const devCode = ref<string | null>(null)
const devMagicUrl = ref<string | null>(null)
const editing = ref(false)

const isLinked = computed(() => Boolean(props.currentEmail) && !editing.value)

const handleSendCode = async () => {
  loading.value = true
  error.value = ''

  try {
    const result = await sendLinkCode(email.value)
    devCode.value = 'devCode' in result ? String(result.devCode) : null
    devMagicUrl.value = 'devMagicUrl' in result ? String(result.devMagicUrl) : null
    step.value = 'code'
  } catch (err: unknown) {
    const status = err && typeof err === 'object' && 'statusCode' in err
      ? (err as { statusCode: number }).statusCode
      : undefined

    error.value = status === 409 ? props.labels.errorConflict : props.labels.errorSendCode
  } finally {
    loading.value = false
  }
}

const handleVerify = async () => {
  loading.value = true
  error.value = ''

  try {
    await verifyLinkCode(email.value, code.value)
    editing.value = false
    code.value = ''
    step.value = 'email'
  } catch {
    error.value = props.labels.errorInvalidCode
  } finally {
    loading.value = false
  }
}

const handleUnlink = async () => {
  loading.value = true
  error.value = ''

  try {
    await unlinkEmail()
    editing.value = false
    email.value = ''
    code.value = ''
    step.value = 'email'
  } catch {
    error.value = props.labels.errorSendCode
  } finally {
    loading.value = false
  }
}

const startChange = () => {
  editing.value = true
  email.value = ''
  code.value = ''
  step.value = 'email'
  error.value = ''
  devCode.value = null
  devMagicUrl.value = null
}
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

    <template v-if="isLinked">
      <p class="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-900 dark:bg-brand-950 dark:text-brand-100">
        {{ labels.linked }}: <strong>{{ currentEmail }}</strong>
      </p>
      <div class="flex flex-wrap gap-2">
        <UiButton
          variant="outline"
          @click="startChange"
        >
          {{ labels.change }}
        </UiButton>
        <UiButton
          variant="outline"
          :loading="loading"
          @click="handleUnlink"
        >
          {{ labels.unlink }}
        </UiButton>
      </div>
    </template>

    <form
      v-else
      class="flex flex-col gap-4"
      @submit.prevent="step === 'email' ? handleSendCode() : handleVerify()"
    >
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
        :loading="loading"
      >
        {{ step === 'email' ? labels.sendCode : labels.submit }}
      </UiButton>
    </form>
  </section>
</template>
