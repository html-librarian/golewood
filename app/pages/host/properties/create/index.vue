<script setup lang="ts">
import {
  DEFAULT_LISTING_CHECK_IN_TIME,
  DEFAULT_LISTING_CHECK_OUT_TIME,
} from '#shared/constants/listing-times'
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({
  layout: 'host',
  middleware: 'auth',
  pageTransition: false,
})

const { t } = usePageI18n({ ru, en })
const localePath = useLocalePath()
const { createProperty } = useListings()

const form = reactive({
  title: '',
  city: '',
  address: '',
  description: '',
  checkInTime: DEFAULT_LISTING_CHECK_IN_TIME,
  checkOutTime: DEFAULT_LISTING_CHECK_OUT_TIME,
})
const loading = ref(false)
const error = ref('')

const handleSubmit = async () => {
  loading.value = true
  error.value = ''

  try {
    const property = await createProperty({
      title: form.title,
      city: form.city,
      address: form.address,
      description: form.description,
      checkInTime: form.checkInTime,
      checkOutTime: form.checkOutTime,
    })
    await navigateTo(localePath(`/host/properties/${property.id}`))
  } catch {
    error.value = t('error')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page-container max-w-xl">
    <header class="mb-8 space-y-2">
      <h1 class="section-title">
        {{ t('title') }}
      </h1>
      <p class="text-sm text-stone-600 dark:text-stone-400">
        {{ t('subtitle') }}
      </p>
    </header>

    <form
      class="surface-card flex flex-col gap-4 p-6"
      @submit.prevent="handleSubmit()"
    >
      <FormInput
        v-model="form.title"
        :label="t('nameLabel')"
        required
      />
      <FormCitySelect
        v-model="form.city"
        :label="t('cityLabel')"
        required
      />
      <FormInput
        v-model="form.address"
        :label="t('addressLabel')"
      />
      <label class="block text-sm font-medium text-stone-700 dark:text-stone-300">
        {{ t('descriptionLabel') }}
        <textarea
          v-model="form.description"
          rows="4"
          class="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-stone-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
        />
      </label>

      <div class="space-y-3 rounded-xl border border-stone-200 p-4 dark:border-stone-700">
        <p class="text-sm font-medium text-stone-700 dark:text-stone-300">
          {{ t('checkInOutTitle') }}
        </p>
        <p class="text-xs text-stone-500 dark:text-stone-400">
          {{ t('checkInOutHint') }}
        </p>
        <div class="grid gap-4 sm:grid-cols-2">
          <FormInput
            v-model="form.checkInTime"
            type="time"
            :label="t('checkInTimeLabel')"
            required
          />
          <FormInput
            v-model="form.checkOutTime"
            type="time"
            :label="t('checkOutTimeLabel')"
            required
          />
        </div>
      </div>

      <p
        v-if="error"
        class="text-sm text-red-600 dark:text-red-400"
      >
        {{ error }}
      </p>

      <div class="flex flex-wrap gap-3 pt-2">
        <UiButton
          type="submit"
          :loading="loading"
        >
          {{ t('submit') }}
        </UiButton>
        <NuxtLink :to="localePath('/host/listings')">
          <UiButton variant="secondary">
            {{ t('cancel') }}
          </UiButton>
        </NuxtLink>
      </div>
    </form>
  </div>
</template>
