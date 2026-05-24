<script setup lang="ts">
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({ middleware: 'auth', pageTransition: false })

const { t } = usePageI18n({ ru, en })
const localePath = useLocalePath()
const { user, completeProfile } = useAuth()

const name = ref(user.value?.name ?? '')
const phone = ref('')
const loading = ref(false)
const error = ref('')

const handleSubmit = async () => {
  loading.value = true
  error.value = ''

  try {
    await completeProfile({ name: name.value, phone: phone.value })
    await navigateTo(localePath('/account'))
  } catch (err: unknown) {
    const status = err && typeof err === 'object' && 'statusCode' in err
      ? (err as { statusCode: number }).statusCode
      : undefined

    error.value = status === 409 ? t('errorConflict') : t('errorSubmit')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page-container flex min-h-[70vh] items-center justify-center py-12">
    <div class="auth-card">
      <div class="mb-8 text-center">
        <h1 class="font-display text-2xl font-semibold text-stone-900 md:text-3xl dark:text-stone-50">
          {{ t('title') }}
        </h1>
        <p class="mt-2 text-sm text-stone-600 dark:text-stone-400">
          {{ t('subtitle') }}
        </p>
      </div>

      <form
        class="flex flex-col gap-4"
        data-testid="complete-profile-form"
        @submit.prevent="handleSubmit()"
      >
        <FormInput
          v-model="name"
          :label="t('nameLabel')"
          autocomplete="name"
          :disabled="loading"
          :error="error"
        />

        <FormPhoneInput
          v-model="phone"
          :label="t('phoneLabel')"
          :disabled="loading"
        />

        <UiButton
          type="submit"
          size="lg"
          class="w-full"
          :loading="loading"
        >
          {{ t('submit') }}
        </UiButton>
      </form>
    </div>
  </div>
</template>
