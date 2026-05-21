<script setup lang="ts">
import ru from './i18n/ru'
import en from './i18n/en'

const { t } = usePageI18n({ ru, en })
const { platformLegal } = usePlatformLegal()

useSiteSeo({
  title: t('title'),
  description: t('intro'),
})
</script>

<template>
  <div class="page-container py-8">
    <div class="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
      <LegalNav class="lg:sticky lg:top-32 lg:self-start" />

      <article class="space-y-6">
        <header class="space-y-2">
          <h1 class="section-title">
            {{ t('title') }}
          </h1>
          <p class="text-sm text-stone-500 dark:text-stone-400">
            {{ t('updated') }}
          </p>
          <p class="max-w-2xl text-stone-600 dark:text-stone-400">
            {{ t('intro') }}
          </p>
        </header>

        <section class="surface-card p-6">
          <h2 class="mb-4 font-display text-lg font-semibold text-stone-900 dark:text-stone-50">
            {{ t('operatorTitle') }}
          </h2>
          <dl class="grid gap-3 text-sm sm:grid-cols-2">
            <div class="sm:col-span-2">
              <dt class="text-stone-500 dark:text-stone-400">
                {{ t('fields.legalName') }}
              </dt>
              <dd class="font-medium text-stone-900 dark:text-stone-100">
                {{ platformLegal.legalName }}
              </dd>
            </div>
            <div>
              <dt class="text-stone-500 dark:text-stone-400">
                {{ t('fields.inn') }}
              </dt>
              <dd class="font-mono text-stone-900 dark:text-stone-100">
                {{ platformLegal.inn }}
              </dd>
            </div>
            <div>
              <dt class="text-stone-500 dark:text-stone-400">
                {{ t('fields.kpp') }}
              </dt>
              <dd class="font-mono text-stone-900 dark:text-stone-100">
                {{ platformLegal.kpp }}
              </dd>
            </div>
            <div>
              <dt class="text-stone-500 dark:text-stone-400">
                {{ t('fields.ogrn') }}
              </dt>
              <dd class="font-mono text-stone-900 dark:text-stone-100">
                {{ platformLegal.ogrn }}
              </dd>
            </div>
            <div class="sm:col-span-2">
              <dt class="text-stone-500 dark:text-stone-400">
                {{ t('fields.legalAddress') }}
              </dt>
              <dd class="text-stone-900 dark:text-stone-100">
                {{ platformLegal.legalAddress }}
              </dd>
            </div>
            <div class="sm:col-span-2">
              <dt class="text-stone-500 dark:text-stone-400">
                {{ t('fields.email') }}
              </dt>
              <dd>
                <a
                  :href="`mailto:${platformLegal.email}`"
                  class="font-medium text-brand-700 hover:underline dark:text-brand-300"
                >
                  {{ platformLegal.email }}
                </a>
              </dd>
            </div>
          </dl>
        </section>

        <section class="surface-card p-6">
          <h2 class="mb-4 font-display text-lg font-semibold text-stone-900 dark:text-stone-50">
            {{ t('bankTitle') }}
          </h2>
          <dl class="grid gap-3 text-sm sm:grid-cols-2">
            <div class="sm:col-span-2">
              <dt class="text-stone-500 dark:text-stone-400">
                {{ t('fields.bankName') }}
              </dt>
              <dd class="text-stone-900 dark:text-stone-100">
                {{ platformLegal.bankName }}
              </dd>
            </div>
            <div class="sm:col-span-2">
              <dt class="text-stone-500 dark:text-stone-400">
                {{ t('fields.bankAccount') }}
              </dt>
              <dd class="font-mono text-stone-900 dark:text-stone-100">
                {{ platformLegal.bankAccount }}
              </dd>
            </div>
            <div>
              <dt class="text-stone-500 dark:text-stone-400">
                {{ t('fields.bik') }}
              </dt>
              <dd class="font-mono text-stone-900 dark:text-stone-100">
                {{ platformLegal.bik }}
              </dd>
            </div>
          </dl>
        </section>

        <p class="text-xs text-stone-500 dark:text-stone-400">
          {{ t('disclaimer') }}
        </p>
      </article>
    </div>
  </div>
</template>
