<script setup lang="ts">
import type { HelpSupportFormLabels } from '~/components/help/support-form/types'
import ru from './i18n/ru'
import en from './i18n/en'

const { t, locale } = usePageI18n({ ru, en })
const { user } = useAuth()
const { supportEmail } = useSupportEmail()

useSiteSeo({
  title: t('title'),
  description: t('intro'),
})

const topics = computed(() => (locale.value === 'en' ? en.topics : ru.topics))

const mailto = computed(
  () => `mailto:${supportEmail.value}?subject=${encodeURIComponent(t('title'))}`,
)

const formLabels = computed((): HelpSupportFormLabels => ({
  name: t('form.name'),
  email: t('form.email'),
  contextUrl: t('form.contextUrl'),
  contextUrlHint: t('form.contextUrlHint'),
  message: t('form.message'),
  submit: t('form.submit'),
  submitting: t('form.submitting'),
  success: t('form.success'),
  error: t('form.error', { email: supportEmail.value }),
  validationMessage: t('form.validationMessage'),
}))

const initialName = computed(() => user.value?.name?.trim() || '')
const initialEmail = computed(() => user.value?.email?.trim() || '')
</script>

<template>
  <div class="page-container py-8">
    <div class="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
      <HelpNav class="lg:sticky lg:top-32 lg:self-start" />

      <article class="space-y-6">
        <header class="space-y-2">
          <h1 class="section-title">
            {{ t('title') }}
          </h1>
          <p class="max-w-2xl text-stone-600 dark:text-stone-400">
            {{ t('intro') }}
          </p>
        </header>

        <div class="surface-card grid gap-6 p-6 sm:grid-cols-2">
          <div>
            <p class="text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400">
              {{ t('emailLabel') }}
            </p>
            <a
              :href="mailto"
              class="mt-1 block text-lg font-semibold text-brand-700 hover:underline dark:text-brand-300"
            >
              {{ supportEmail }}
            </a>
          </div>
          <div>
            <p class="text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400">
              {{ t('hoursLabel') }}
            </p>
            <p class="mt-1 text-sm text-stone-700 dark:text-stone-300">
              {{ t('hours') }}
            </p>
          </div>
        </div>

        <section class="space-y-4">
          <h2 class="font-display text-lg font-semibold text-stone-900 dark:text-stone-50">
            {{ t('formTitle') }}
          </h2>
          <HelpSupportForm
            :labels="formLabels"
            :initial-name="initialName"
            :initial-email="initialEmail"
          />
        </section>

        <section class="surface-card p-6">
          <h2 class="mb-3 font-display text-lg font-semibold text-stone-900 dark:text-stone-50">
            {{ t('topicsTitle') }}
          </h2>
          <ul class="list-inside list-disc space-y-2 text-sm text-stone-600 dark:text-stone-400">
            <li
              v-for="(topic, index) in topics"
              :key="index"
            >
              {{ topic }}
            </li>
          </ul>
          <a
            :href="mailto"
            class="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:underline dark:text-brand-300"
          >
            <Icon
              name="ph:envelope-duotone"
              class="size-5"
            />
            {{ t('writeUs') }}
          </a>
        </section>
      </article>
    </div>
  </div>
</template>
