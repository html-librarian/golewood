<script setup lang="ts">
import { formatPrice } from '#shared/utils/format'
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({
  layout: 'host',
  middleware: 'auth',
  pageTransition: false,
})

const route = useRoute()
const listingId = computed(() => String(route.params.id))
const { t } = usePageI18n({ ru, en })
const localePath = useLocalePath()
const { fetchHostOffers, saveHostOffers } = useGiftCertificates()

const selected = ref<number[]>([])
const saving = ref(false)
const successMessage = ref<string | null>(null)
const errorMessage = ref<string | null>(null)

const { data, pending, refresh, error } = await useAsyncData(
  () => `host-gift-offers-${listingId.value}`,
  () => fetchHostOffers(listingId.value),
)

watch(data, (value) => {
  if (!value) {
    return
  }

  selected.value = value.offers.filter(offer => offer.isActive).map(offer => offer.amountRub)
}, { immediate: true })

const toggleAmount = (amount: number) => {
  if (selected.value.includes(amount)) {
    selected.value = selected.value.filter(value => value !== amount)
  } else {
    selected.value = [...selected.value, amount].sort((a, b) => a - b)
  }
}

const handleSave = async () => {
  if (!selected.value.length) {
    errorMessage.value = t('emptySelection')
    return
  }

  saving.value = true
  successMessage.value = null
  errorMessage.value = null

  try {
    await saveHostOffers(listingId.value, { amountsRub: selected.value })
    successMessage.value = t('saved')
    await refresh()
  } catch {
    errorMessage.value = t('saveFailed')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="page-container max-w-xl space-y-8">
    <header class="space-y-3">
      <NuxtLink
        :to="localePath('/host/listings')"
        class="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline dark:text-brand-400"
      >
        <Icon
          name="ph:arrow-left"
          class="size-4"
        />
        {{ t('backToListings') }}
      </NuxtLink>
      <div class="space-y-1">
        <h1 class="section-title">
          {{ t('title') }}
        </h1>
        <p class="text-sm text-stone-600 dark:text-stone-400">
          {{ t('subtitle') }}
        </p>
      </div>
    </header>

    <p
      v-if="error"
      class="text-sm text-red-600 dark:text-red-400"
    >
      {{ error.message }}
    </p>

    <UiSkeleton
      v-if="pending"
      class="h-48 w-full"
    />

    <template v-else-if="data">
      <p class="text-sm text-stone-600 dark:text-stone-400">
        {{ t('nominalsHint') }}
      </p>

      <ul class="grid gap-3 sm:grid-cols-2">
        <li
          v-for="amount in data.nominals"
          :key="amount"
        >
          <label
            class="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 transition hover:border-brand-300 dark:border-stone-700 dark:bg-stone-950 dark:hover:border-brand-700"
            :class="selected.includes(amount) ? 'border-brand-500 ring-1 ring-brand-500/30 dark:border-brand-600' : ''"
          >
            <span class="font-medium text-stone-900 dark:text-stone-100">
              {{ formatPrice(amount) }}
            </span>
            <input
              type="checkbox"
              class="size-4 rounded border-stone-300 text-brand-600 focus:ring-brand-500 dark:border-stone-600"
              :checked="selected.includes(amount)"
              @change="toggleAmount(amount)"
            >
          </label>
        </li>
      </ul>

      <p
        v-if="successMessage"
        class="text-sm text-emerald-700 dark:text-emerald-300"
      >
        {{ successMessage }}
      </p>
      <p
        v-if="errorMessage"
        class="text-sm text-red-600 dark:text-red-400"
      >
        {{ errorMessage }}
      </p>

      <UiButton
        class="w-full sm:w-auto"
        :loading="saving"
        @click="handleSave()"
      >
        {{ t('save') }}
      </UiButton>
    </template>
  </div>
</template>
