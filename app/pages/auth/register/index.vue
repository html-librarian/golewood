<script setup lang="ts">
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({ pageTransition: false })

const { t } = usePageI18n({ ru, en })
const localePath = useLocalePath()
const { sendCode, verifyCode } = useAuth()
const { phoneAuthEnabled, emailSignInEnabled } = useAuthFeatures()

const emailLabels = computed(() => ({
  emailLabel: t('emailLabel'),
  codeLabel: t('emailCodeLabel'),
  sendCode: t('sendCode'),
  submit: t('submit'),
  devCode: t('devCode'),
  errorSendCode: t('errorSendCode'),
  errorInvalidCode: t('errorInvalidCode'),
  nameLabel: t('nameLabel'),
}))

const onEmailSuccess = async () => {
  await navigateTo(localePath('/account'))
}

const name = ref('')
const phone = ref('')
const code = ref('')
const step = ref<'form' | 'code'>('form')
const loading = ref(false)
const error = ref('')
const devCode = ref<string | null>(null)

const handleSendCode = async () => {
  loading.value = true
  error.value = ''

  try {
    const result = await sendCode(phone.value)
    devCode.value = 'devCode' in result ? String(result.devCode) : null
    step.value = 'code'
  } catch {
    error.value = t('errorSendCode')
  } finally {
    loading.value = false
  }
}

const handleVerify = async () => {
  loading.value = true
  error.value = ''

  try {
    await verifyCode({ phone: phone.value, code: code.value, name: name.value })
    await navigateTo(localePath('/account'))
  } catch {
    error.value = t('errorInvalidCode')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page-container flex min-h-[70vh] items-center justify-center py-12">
    <div class="auth-card">
      <div class="mb-8 text-center">
        <div class="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
          <Icon
            name="ph:user-plus-duotone"
            class="size-8"
          />
        </div>
        <h1 class="font-display text-2xl font-semibold text-stone-900 md:text-3xl dark:text-stone-50">
          {{ t('title') }}
        </h1>
        <p class="mt-2 text-sm text-stone-600 dark:text-stone-400">
          {{
            emailSignInEnabled
              ? t('subtitleEmail')
              : t('subtitleOAuth')
          }}
        </p>
      </div>

      <div class="flex flex-col gap-2">
        <a
          href="/api/auth/oauth/yandex"
          class="oauth-button"
        >
          {{ t('oauthYandex') }}
        </a>
        <a
          href="/api/auth/oauth/vk"
          class="oauth-button"
        >
          {{ t('oauthVk') }}
        </a>
      </div>

      <template v-if="phoneAuthEnabled">
        <div class="my-6 flex items-center gap-3">
          <div class="h-px flex-1 bg-stone-200 dark:bg-stone-800" />
          <span class="text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">{{ t('oauthDivider') }}</span>
          <div class="h-px flex-1 bg-stone-200 dark:bg-stone-800" />
        </div>

        <form
          class="flex flex-col gap-4"
          @submit.prevent="step === 'form' ? handleSendCode() : handleVerify()"
        >
          <FormInput
            v-if="step === 'form'"
            v-model="name"
            :label="t('nameLabel')"
            autocomplete="name"
          />

          <FormPhoneInput
            v-model="phone"
            :label="t('phoneLabel')"
            :disabled="step === 'code' || loading"
            :error="step === 'form' ? error : undefined"
            required
          />

          <FormInput
            v-if="step === 'code'"
            v-model="code"
            :label="t('codeLabel')"
            maxlength="4"
            autocomplete="one-time-code"
            :error="error"
            required
          />

          <p
            v-if="devCode"
            class="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800 dark:bg-brand-950 dark:text-brand-200"
          >
            {{ t('devCode') }}: <strong>{{ devCode }}</strong>
          </p>

          <UiButton
            type="submit"
            size="lg"
            class="w-full"
            :loading="loading"
          >
            {{ step === 'form' ? t('sendCode') : t('submit') }}
          </UiButton>
        </form>
      </template>

      <template v-if="emailSignInEnabled">
        <div
          v-if="phoneAuthEnabled"
          class="my-6 flex items-center gap-3"
        >
          <div class="h-px flex-1 bg-stone-200 dark:bg-stone-800" />
          <span class="text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">{{ t('emailDivider') }}</span>
          <div class="h-px flex-1 bg-stone-200 dark:bg-stone-800" />
        </div>

        <AuthEmailSignIn
          :labels="emailLabels"
          register-mode
          @success="onEmailSuccess"
        />
      </template>

      <LegalConsentNotice class="mt-6" />

      <p class="mt-4 text-center text-sm text-stone-600 dark:text-stone-400">
        {{ t('hasAccount') }}
        <NuxtLink
          :to="localePath('/auth/login')"
          class="font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-300"
        >
          {{ t('login') }}
        </NuxtLink>
      </p>
    </div>
  </div>
</template>
