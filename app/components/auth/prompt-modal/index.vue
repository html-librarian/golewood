<script setup lang="ts">
import loginRu from '~/pages/auth/login/i18n/ru'
import loginEn from '~/pages/auth/login/i18n/en'
import ru from './i18n/ru'
import en from './i18n/en'
import type { AuthPromptModalEmits, AuthPromptModalProps } from './types'

const props = defineProps<AuthPromptModalProps>()
const emit = defineEmits<AuthPromptModalEmits>()

const { t } = usePageI18n({ ru, en })
const { locale } = useI18n()
const { fetchMe } = useAuth()
const { phoneAuthEnabled, emailSignInEnabled } = useAuthFeatures()

const mode = ref<'login' | 'register'>('login')

const loginDict = computed(() => (locale.value === 'en' ? loginEn : loginRu))

const tLogin = (key: keyof typeof loginRu) => loginDict.value[key]

const emailLabels = computed(() => ({
  emailLabel: tLogin('emailLabel'),
  codeLabel: tLogin('emailCodeLabel'),
  sendCode: tLogin('sendCode'),
  submit: mode.value === 'register' ? tLogin('register') : tLogin('submit'),
  devCode: tLogin('devCode'),
  errorSendCode: tLogin('errorSendCode'),
  errorInvalidCode: tLogin('errorInvalidCode'),
  errorConflict: tLogin('errorEmailConflict'),
  phoneLabel: tLogin('phoneLabel'),
  linkPhoneHint: tLogin('linkPhoneHint'),
}))

const close = () => {
  emit('update:open', false)
}

const onEmailSuccess = async () => {
  await fetchMe()
  emit('success')
  close()
}

const toggleMode = () => {
  mode.value = mode.value === 'login' ? 'register' : 'login'
}

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    close()
  }
}

watch(() => props.open, (open) => {
  if (!open) {
    mode.value = 'login'
  }

  if (import.meta.client) {
    document.body.classList.toggle('overflow-hidden', open)
  }
})

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)

  if (import.meta.client) {
    document.body.classList.remove('overflow-hidden')
  }
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[250] flex items-end justify-center p-4 sm:items-center"
      data-testid="auth-prompt-modal"
    >
      <button
        type="button"
        class="absolute inset-0 bg-stone-900/50 backdrop-blur-[2px] dark:bg-stone-950/70"
        :aria-label="t('back')"
        @click="close()"
      />

      <article
        class="relative max-h-[min(90vh,720px)] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-(--shadow-float) dark:bg-stone-900"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-prompt-title"
      >
        <header class="space-y-2 pr-8">
          <h2
            id="auth-prompt-title"
            class="font-display text-xl font-semibold text-stone-900 dark:text-stone-50"
          >
            {{ title }}
          </h2>
          <p
            v-if="description"
            class="text-sm leading-relaxed text-stone-600 dark:text-stone-400"
          >
            {{ description }}
          </p>
        </header>

        <div class="mt-6 space-y-6">
          <div class="flex flex-col gap-2">
            <a
              href="/api/auth/oauth/yandex"
              class="oauth-button"
            >
              {{ tLogin('oauthYandex') }}
            </a>
            <a
              href="/api/auth/oauth/vk"
              class="oauth-button"
            >
              {{ tLogin('oauthVk') }}
            </a>
          </div>

          <template v-if="emailSignInEnabled">
            <div class="flex items-center gap-3">
              <div class="h-px flex-1 bg-stone-200 dark:bg-stone-800" />
              <span class="text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">
                {{ tLogin('emailDivider') }}
              </span>
              <div class="h-px flex-1 bg-stone-200 dark:bg-stone-800" />
            </div>

            <AuthEmailSignIn
              :labels="emailLabels"
              :register-mode="mode === 'register'"
              :allow-phone-link="phoneAuthEnabled && mode === 'login'"
              @success="onEmailSuccess()"
            />
          </template>
        </div>

        <button
          type="button"
          class="mt-4 w-full text-center text-sm font-medium text-brand-700 hover:text-brand-800 dark:text-brand-300"
          @click="toggleMode()"
        >
          {{ mode === 'login' ? t('switchToRegister') : t('switchToLogin') }}
        </button>

        <LegalConsentNotice class="mt-5" />

        <UiButton
          type="button"
          variant="outline"
          class="mt-5 w-full"
          data-testid="auth-prompt-back"
          @click="close()"
        >
          {{ t('back') }}
        </UiButton>
      </article>
    </div>
  </Teleport>
</template>
