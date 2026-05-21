<script setup lang="ts">
import { LISTING_STATUS_LABELS } from '#shared/types/listing'
import { formatPrice } from '#shared/utils/format'
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({
  layout: 'host',
  middleware: 'auth',
  pageTransition: false,
})

const { t } = usePageI18n({ ru, en })
const { locale } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const { fetchPropertyForHost, fetchHostListings, attachListingsToProperty } = useListings()

const attachIds = ref<string[]>([])
const attachLoading = ref(false)
const attachError = ref('')

const { data: hostListings } = await useAsyncData('host-listings-attach', () => fetchHostListings())

const attachableListings = computed(() =>
  (hostListings.value ?? []).filter(listing => listing.kind === 'standalone'),
)

const toggleAttach = (id: string) => {
  attachIds.value = attachIds.value.includes(id)
    ? attachIds.value.filter(item => item !== id)
    : [...attachIds.value, id]
}

const submitAttach = async () => {
  if (!attachIds.value.length) {
    return
  }

  attachLoading.value = true
  attachError.value = ''

  try {
    await attachListingsToProperty(propertyId.value, attachIds.value)
    attachIds.value = []
    await refreshNuxtData(`host-property-${propertyId.value}`)
  } catch {
    attachError.value = t('attachError')
  } finally {
    attachLoading.value = false
  }
}

const propertyId = computed(() => String(route.params.id))

const { data: property, pending } = await useAsyncData(
  () => `host-property-${propertyId.value}`,
  () => fetchPropertyForHost(propertyId.value),
)

const statusLabel = (status: keyof typeof LISTING_STATUS_LABELS) => {
  const labels = LISTING_STATUS_LABELS[status]
  return locale.value === 'en' ? labels.en : labels.ru
}
</script>

<template>
  <div class="page-container">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <NuxtLink
          :to="localePath('/host/listings')"
          class="mb-2 inline-flex text-sm font-medium text-brand-700 dark:text-brand-300"
        >
          ← {{ t('back') }}
        </NuxtLink>
        <h1 class="section-title">
          {{ property?.title ?? t('title') }}
        </h1>
        <p
          v-if="property"
          class="mt-1 text-sm text-stone-600 dark:text-stone-400"
        >
          {{ property.city }}<span v-if="property.address">, {{ property.address }}</span>
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <NuxtLink
          v-if="property"
          :to="localePath(`/host/listings/create?propertyId=${property.id}`)"
        >
          <UiButton>{{ t('addUnit') }}</UiButton>
        </NuxtLink>
        <NuxtLink
          v-if="property"
          :to="localePath(`/host/listings/create?id=${property.id}`)"
        >
          <UiButton variant="secondary">
            {{ t('editProperty') }}
          </UiButton>
        </NuxtLink>
      </div>
    </div>

    <div
      v-if="pending"
      class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      <UiSkeleton
        v-for="n in 3"
        :key="n"
        variant="card"
      />
    </div>

    <section
      v-if="attachableListings.length"
      class="surface-card mb-6 space-y-3 p-5"
    >
      <h2 class="font-semibold text-stone-900 dark:text-stone-50">
        {{ t('attachTitle') }}
      </h2>
      <p class="text-sm text-stone-600 dark:text-stone-400">
        {{ t('attachHint') }}
      </p>
      <ul class="max-h-48 space-y-2 overflow-y-auto">
        <li
          v-for="listing in attachableListings"
          :key="listing.id"
        >
          <label class="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              :checked="attachIds.includes(listing.id)"
              class="size-4 rounded border-stone-300 text-brand-700"
              @change="toggleAttach(listing.id)"
            >
            <span>{{ listing.title }} · {{ listing.city }}</span>
          </label>
        </li>
      </ul>
      <p
        v-if="attachError"
        class="text-sm text-red-600 dark:text-red-400"
      >
        {{ attachError }}
      </p>
      <UiButton
        type="button"
        :loading="attachLoading"
        :disabled="!attachIds.length"
        @click="submitAttach()"
      >
        {{ t('attachSubmit') }}
      </UiButton>
    </section>

    <p
      v-if="!pending && !property?.units?.length"
      class="surface-card p-6 text-sm text-stone-600 dark:text-stone-400"
    >
      {{ t('emptyUnits') }}
    </p>

    <ul
      v-else-if="property?.units?.length"
      class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      <li
        v-for="unit in property.units"
        :key="unit.id"
        class="surface-card overflow-hidden"
      >
        <div class="relative aspect-4/3 bg-stone-100 dark:bg-stone-800">
          <ListingImage
            v-if="unit.coverPhoto"
            :src="unit.coverPhoto.url"
            :alt="unit.title"
            class="size-full object-cover"
          />
          <ListingImagePlaceholder v-else />
        </div>
        <div class="space-y-2 p-4">
          <h2 class="font-semibold text-stone-900 dark:text-stone-50">
            {{ unit.title }}
          </h2>
          <p class="text-sm text-stone-600 dark:text-stone-400">
            {{ formatPrice(unit.pricePerNight) }} · {{ statusLabel(unit.status) }}
          </p>
          <NuxtLink :to="localePath(`/host/listings/create?id=${unit.id}`)">
            <UiButton
              variant="outline"
              size="sm"
            >
              {{ t('unitEdit') }}
            </UiButton>
          </NuxtLink>
        </div>
      </li>
    </ul>
  </div>
</template>
