<script setup lang="ts">
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({ pageTransition: false })

const { t } = usePageI18n({ ru, en })
const { sendCode, verifyCode, isAuthenticated, fetchMe, isMfaChallenge } = useAuth()
const { verifyMfa, resendMfa } = useTwoFactor()
const { phoneAuthEnabled, emailSignInEnabled } = useAuthFeatures()
const localePath = useLocalePath()
const route = useRoute()
const router = useRouter()

const emailLabels = computed(() => ({
  emailLabel: t('emailLabel'),
  codeLabel: t('emailCodeLabel'),
  sendCode: t('sendCode'),
  submit: t('submit'),
  devCode: t('devCode'),
  errorSendCode: t('errorSendCode'),
  errorInvalidCode: t('errorInvalidCode'),
  errorConflict: t('errorEmailConflict'),
  phoneLabel: t('phoneLabel'),
  linkPhoneHint: t('linkPhoneHint'),
}))

const onEmailSuccess = async () => {
  await navigateTo(localePath('/account'))
}

onMounted(async () => {
  const oauthMfa = applyOAuthMfaFromQuery()

  if (oauthMfa) {
    await router.replace({ path: localePath('/auth/login'), query: {} })
  }

  if (!isAuthenticated.value) {
    await fetchMe()
  }

  if (isAuthenticated.value && !oauthMfa) {
    await navigateTo(localePath('/account'), { replace: true })
  }
})

const phone = ref('')
const code = ref('')
const step = ref<'phone' | 'code' | 'mfa'>('phone')
const loading = ref(false)
const error = ref('')
const devCode = ref<string | null>(null)
const mfaChallenge = ref<{ challengeToken: string, maskedEmail: string } | null>(null)
const mfaCode = ref('')

const mfaSubtitle = computed(() =>
  mfaChallenge.value
    ? t('mfaSubtitle', { email: mfaChallenge.value.maskedEmail })
    : '',
)

const applyOAuthMfaFromQuery = () => {
  if (route.query.mfa !== '1' || typeof route.query.challenge !== 'string') {
    return false
  }

  mfaChallenge.value = {
    challengeToken: route.query.challenge,
    maskedEmail: typeof route.query.masked === 'string' ? route.query.masked : '',
  }
  devCode.value = typeof route.query.devCode === 'string' ? route.query.devCode : null
  step.value = 'mfa'
  return true
}

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
    const result = await verifyCode({ phone: phone.value, code: code.value })

    if (isMfaChallenge(result)) {
      mfaChallenge.value = {
        challengeToken: result.challengeToken,
        maskedEmail: result.maskedEmail,
      }
      devCode.value = result.devCode ? String(result.devCode) : null
      step.value = 'mfa'
      return
    }

    await navigateTo(localePath('/account'))
  } catch {
    error.value = t('errorInvalidCode')
  } finally {
    loading.value = false
  }
}

const handleVerifyMfa = async () => {
  if (!mfaChallenge.value) {
    return
  }

  loading.value = true
  error.value = ''

  try {
    await verifyMfa(mfaChallenge.value.challengeToken, mfaCode.value)
    await navigateTo(localePath('/account'))
  } catch {
    error.value = t('errorInvalidCode')
  } finally {
    loading.value = false
  }
}

const handleResendMfa = async () => {
  if (!mfaChallenge.value) {
    return
  }

  loading.value = true
  error.value = ''

  try {
    const result = await resendMfa(mfaChallenge.value.challengeToken)
    devCode.value = result.devCode ? String(result.devCode) : null
  } catch {
    error.value = t('errorSendCode')
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
            name="ph:user-circle-duotone"
            class="size-8"
          />
        </div>
        <h1 class="font-display text-2xl font-semibold text-stone-900 md:text-3xl dark:text-stone-50">
          {{ t('title') }}
        </h1>
        <p class="mt-2 text-sm text-stone-600 dark:text-stone-400">
          {{
            phoneAuthEnabled
              ? t('subtitle')
              : emailSignInEnabled
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

      <form
        v-if="step === 'mfa'"
        data-testid="auth-mfa-form"
        class="flex flex-col gap-4"
        @submit.prevent="handleVerifyMfa()"
      >
        <p class="text-sm text-stone-600 dark:text-stone-400">
          {{ mfaSubtitle }}
        </p>

        <FormInput
          v-model="mfaCode"
          :label="t('mfaCodeLabel')"
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
          {{ t('mfaSubmit') }}
        </UiButton>

        <UiButton
          type="button"
          variant="ghost"
          class="w-full"
          :disabled="loading"
          @click="handleResendMfa()"
        >
          {{ t('mfaResend') }}
        </UiButton>
      </form>

      <template v-else-if="phoneAuthEnabled">
        <div class="my-6 flex items-center gap-3">
          <div class="h-px flex-1 bg-stone-200 dark:bg-stone-800" />
          <span class="text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">{{ t('oauthDivider') }}</span>
          <div class="h-px flex-1 bg-stone-200 dark:bg-stone-800" />
        </div>

        <form
          data-testid="auth-phone-form"
          class="flex flex-col gap-4"
          @submit.prevent="step === 'phone' ? handleSendCode() : handleVerify()"
        >
          <FormPhoneInput
            v-model="phone"
            :label="t('phoneLabel')"
            :disabled="step === 'code' || loading"
            :error="step === 'phone' ? error : undefined"
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
            {{ step === 'phone' ? t('sendCode') : t('submit') }}
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
          :allow-phone-link="phoneAuthEnabled"
          @success="onEmailSuccess"
        />
      </template>

      <LegalConsentNotice class="mt-6" />

      <p class="mt-4 text-center text-sm text-stone-600 dark:text-stone-400">
        {{ t('noAccount') }}
        <NuxtLink
          :to="localePath('/auth/register')"
          class="font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-300"
        >
          {{ t('register') }}
        </NuxtLink>
      </p>
    </div>
  </div>
</template>
