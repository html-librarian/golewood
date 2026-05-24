<script setup lang="ts">
import { formatUserDisplayName, formatUserInitials } from '#shared/utils/user-display'
import { isPlaceholderPhone } from '#shared/utils/synthetic-phone-detect'
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({ layout: 'account', middleware: 'auth', pageTransition: false })

const { t } = usePageI18n({ ru, en })
const { user } = useAuth()
const { phoneAuthEnabled, emailAuthEnabled } = useAuthFeatures()

const userDisplayName = computed(() =>
  user.value ? formatUserDisplayName(user.value) : '',
)

const userInitials = computed(() => formatUserInitials(user.value ?? undefined))

const phoneDisplay = computed(() => {
  if (!user.value?.phone) {
    return ''
  }

  return isPlaceholderPhone(user.value.phone) ? '' : user.value.phone
})

const showPhoneChange = computed(() =>
  Boolean(user.value && (phoneAuthEnabled.value || emailAuthEnabled.value)),
)

const roleLabel = computed(() => {
  const role = user.value?.role
  if (!role) {
    return ''
  }

  if (role === 'content_manager') {
    return t('roles.contentManager')
  }

  return t(`roles.${role}` as 'roles.guest')
})

const phoneLinkLabels = computed(() => ({
  title: t('phoneLink.title'),
  subtitle: t('phoneLink.subtitle'),
  syntheticHint: t('phoneLink.syntheticHint'),
  emailCodeHint: t('phoneLink.emailCodeHint'),
  currentSubtitle: t('phoneLink.currentSubtitle'),
  currentCodeLabel: t('phoneLink.currentCodeLabel'),
  sendCurrentCode: t('phoneLink.sendCurrentCode'),
  verifyCurrentCode: t('phoneLink.verifyCurrentCode'),
  phoneLabel: t('phoneLink.phoneLabel'),
  codeLabel: t('phoneLink.codeLabel'),
  sendCode: t('phoneLink.sendCode'),
  submit: t('phoneLink.submit'),
  devCode: t('phoneLink.devCode'),
  errorSendCode: t('phoneLink.errorSendCode'),
  errorInvalidCode: t('phoneLink.errorInvalidCode'),
  errorConflict: t('phoneLink.errorConflict'),
  errorNeedCurrent: t('phoneLink.errorNeedCurrent'),
  smsDisabled: t('phoneLink.smsDisabled'),
}))

const emailLinkLabels = computed(() => ({
  title: t('emailLink.title'),
  subtitle: t('emailLink.subtitle'),
  linked: t('emailLink.linked'),
  emailLabel: t('emailLink.emailLabel'),
  codeLabel: t('emailLink.codeLabel'),
  sendCode: t('emailLink.sendCode'),
  submit: t('emailLink.submit'),
  unlink: t('emailLink.unlink'),
  change: t('emailLink.change'),
  devCode: t('emailLink.devCode'),
  errorSendCode: t('emailLink.errorSendCode'),
  errorInvalidCode: t('emailLink.errorInvalidCode'),
  errorConflict: t('emailLink.errorConflict'),
}))

const maxLabels = computed(() => ({
  title: t('max.title'),
  subtitle: t('max.subtitle'),
  disabledHint: t('max.disabledHint'),
  connect: t('max.connect'),
  linked: t('max.linked'),
  unlink: t('max.unlink'),
  openBot: t('max.openBot'),
  codeExpires: t('max.codeExpires'),
  loadError: t('max.loadError'),
  linkError: t('max.linkError'),
  unlinkError: t('max.unlinkError'),
  mockLink: t('max.mockLink'),
}))

const twoFactorLabels = computed(() => ({
  title: t('twoFactor.title'),
  subtitle: t('twoFactor.subtitle'),
  enabled: t('twoFactor.enabled'),
  disabled: t('twoFactor.disabled'),
  needEmail: t('twoFactor.needEmail'),
  codeLabel: t('twoFactor.codeLabel'),
  sendEnableCode: t('twoFactor.sendEnableCode'),
  confirmEnable: t('twoFactor.confirmEnable'),
  sendDisableCode: t('twoFactor.sendDisableCode'),
  confirmDisable: t('twoFactor.confirmDisable'),
  devCode: t('twoFactor.devCode'),
  errorSendCode: t('twoFactor.errorSendCode'),
  errorInvalidCode: t('twoFactor.errorInvalidCode'),
  loadError: t('twoFactor.loadError'),
}))

const sessionsLabels = computed(() => ({
  title: t('sessions.title'),
  subtitle: t('sessions.subtitle'),
  current: t('sessions.current'),
  lastActive: t('sessions.lastActive'),
  revoke: t('sessions.revoke'),
  revokeOthers: t('sessions.revokeOthers'),
  empty: t('sessions.empty'),
  loadError: t('sessions.loadError'),
  retry: t('sessions.retry'),
  deviceUnknown: t('sessions.deviceUnknown'),
  devicePhone: t('sessions.devicePhone'),
  justNow: t('sessions.justNow'),
  minutesAgo: (n: number) => t('sessions.minutesAgo', { n }),
  hoursAgo: (n: number) => t('sessions.hoursAgo', { n }),
  daysAgo: (n: number) => t('sessions.daysAgo', { n }),
  showMore: (n: number) => t('sessions.showMore', { n }),
}))

</script>

<template>
  <div class="page-container max-w-2xl space-y-8">
    <header class="space-y-1">
      <h1 class="section-title">
        {{ t('title') }}
      </h1>
      <p class="text-sm text-stone-600 dark:text-stone-400">
        {{ t('subtitle') }}
      </p>
    </header>

    <section
      v-if="user"
      class="surface-card space-y-4 p-5"
    >
      <div class="flex items-center gap-3">
        <span class="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-100 text-lg font-semibold text-brand-800 dark:bg-brand-900 dark:text-brand-200">
          {{ userInitials }}
        </span>
        <div class="min-w-0">
          <p class="truncate text-lg font-semibold text-stone-900 dark:text-stone-50">
            {{ userDisplayName }}
          </p>
          <p class="text-sm text-stone-500 dark:text-stone-400">
            {{ roleLabel }}
          </p>
        </div>
      </div>

      <dl class="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt class="text-stone-500 dark:text-stone-400">
            {{ t('phone') }}
          </dt>
          <dd class="font-medium text-stone-900 dark:text-stone-100">
            {{ phoneDisplay || t('phoneNotSet') }}
          </dd>
        </div>
        <div v-if="user.email">
          <dt class="text-stone-500 dark:text-stone-400">
            {{ t('email') }}
          </dt>
          <dd class="font-medium text-stone-900 dark:text-stone-100">
            {{ user.email }}
          </dd>
        </div>
        <div>
          <dt class="text-stone-500 dark:text-stone-400">
            {{ t('role') }}
          </dt>
          <dd class="font-medium text-stone-900 dark:text-stone-100">
            {{ roleLabel }}
          </dd>
        </div>
      </dl>
    </section>

    <section class="surface-card p-5">
      <h2 class="mb-1 text-base font-semibold text-stone-900 dark:text-stone-50">
        {{ t('homeCity.title') }}
      </h2>
      <AccountHomeCity
        :initial-city="user?.homeCity"
        :label="t('homeCity.cityLabel')"
        :hint="t('homeCity.hint')"
        :save-label="t('homeCity.save')"
        :saved-label="t('homeCity.saved')"
        :error-save="t('homeCity.errorSave')"
      />
    </section>

    <AccountPhoneChange
      v-if="showPhoneChange"
      :labels="phoneLinkLabels"
      :current-phone="user!.phone"
      :verify-via-email="!phoneAuthEnabled && emailAuthEnabled"
    />

    <AccountEmailLink
      v-if="user"
      :labels="emailLinkLabels"
      :current-email="user.email"
    />

    <AccountTwoFactor
      :labels="twoFactorLabels"
      :has-email="Boolean(user?.email)"
    />

    <AccountMaxNotifications
      :labels="maxLabels"
    />

    <AccountSessions :labels="sessionsLabels" />
  </div>
</template>
