<script setup lang="ts">
import type { AuthSession, User } from '#shared/types/user'
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({ pageTransition: false })

const { t } = usePageI18n({ ru, en })
const localePath = useLocalePath()
const route = useRoute()
const { applySession, user, fetchMe } = useAuth()

const status = ref<'loading' | 'success' | 'error'>('loading')
const message = ref('')

onMounted(async () => {
  const token = typeof route.query.token === 'string' ? route.query.token : ''

  if (!token) {
    status.value = 'error'
    message.value = t('errorMissing')
    return
  }

  try {
    const result = await $fetch<{
      type: 'login'
      session: AuthSession
    } | {
      type: 'account-email'
      user: User
    }>('/api/auth/email/magic', {
      method: 'POST',
      body: { token },
    })

    if (result.type === 'login') {
      applySession(result.session)
      status.value = 'success'
      message.value = t('successLogin')
      await navigateTo(localePath('/account'))
      return
    }

    await fetchMe()

    if (user.value?.id === result.user.id) {
      user.value = result.user
    }

    status.value = 'success'
    message.value = t('successEmail')
    await navigateTo(localePath('/account'))
  } catch {
    status.value = 'error'
    message.value = t('errorInvalid')
  }
})
</script>

<template>
  <div class="page-container flex min-h-[60vh] items-center justify-center py-12">
    <div class="auth-card text-center">
      <Icon
        v-if="status === 'loading'"
        name="ph:circle-notch"
        class="mx-auto size-10 animate-spin text-brand-600 dark:text-brand-400"
      />
      <p
        class="text-sm"
        :class="status === 'error'
          ? 'text-red-600 dark:text-red-400'
          : 'text-stone-600 dark:text-stone-400'"
      >
        {{ status === 'loading' ? t('loading') : message }}
      </p>
      <NuxtLink
        v-if="status === 'error'"
        :to="localePath('/auth/login')"
        class="mt-4 inline-block text-sm font-semibold text-brand-700 dark:text-brand-400"
      >
        {{ t('backToLogin') }}
      </NuxtLink>
    </div>
  </div>
</template>
