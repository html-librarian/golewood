<script setup lang="ts">
import {
  DEFAULT_LISTING_CHECK_IN_TIME,
  DEFAULT_LISTING_CHECK_OUT_TIME,
} from '#shared/constants/listing-times'
import { CANCELLATION_POLICIES, CANCELLATION_POLICY_LABELS } from '#shared/types/listing'
import type { AmenityCatalogItem } from '#shared/types/catalog'
import type { ListingDocument, ListingPhoto } from '#shared/types/listing'
import { listingContactsFromForm, listingContactsToForm } from '#shared/utils/listing-contacts'
import {
  buildListingMetaDescription,
  buildListingMetaTitle,
} from '#shared/utils/listing-seo'
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({
  layout: 'host',
  middleware: 'auth',
  key: route => route.fullPath,
  pageTransition: false,
})

const { t } = usePageI18n({ ru, en })
const { locale } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const { createListing, updateListing, submitListing, fetchHostListingById, fetchPropertyForHost } = useListings()
const { fetchAmenities, fetchAccommodationTypes } = useCatalog()

const { data: amenityCatalog } = await useAsyncData('wizard-amenities', () => fetchAmenities())
const { data: accommodationTypeCatalog } = await useAsyncData('wizard-accommodation-types', () => fetchAccommodationTypes())

const step = ref(1)
const listingId = ref<string | null>(null)
const isTeamManaged = ref(false)
const propertyListingId = computed(() =>
  typeof route.query.propertyId === 'string' ? route.query.propertyId : undefined,
)
const isEditing = computed(() => Boolean(listingId.value))
const loading = ref(false)
const loadingListing = ref(false)
const error = ref('')
const photos = ref<ListingPhoto[]>([])
const documents = ref<ListingDocument[]>([])

const resolveListingId = () =>
  typeof route.query.id === 'string' ? route.query.id : listingId.value

const form = reactive({
  title: '',
  city: '',
  address: '',
  description: '',
  pricePerNight: '3000',
  cancellationPolicy: 'moderate' as typeof CANCELLATION_POLICIES[number],
  maxGuests: '2',
  bedrooms: '1',
  houseRules: '',
  checkInTime: DEFAULT_LISTING_CHECK_IN_TIME,
  checkOutTime: DEFAULT_LISTING_CHECK_OUT_TIME,
  amenities: [] as string[],
  accommodationType: '',
  transferOffered: false,
  transferPrice: '',
  transferPriceOnRequest: false,
  extraGuestsOffered: false,
  maxGuestsWithExtra: '',
  extraGuestPricePerNight: '',
  contacts: listingContactsToForm(null),
  metaTitle: '',
  metaDescription: '',
  sourceAttributionRu: '',
  sourceAttributionEn: '',
})

const amenityLabel = (item: AmenityCatalogItem) =>
  locale.value === 'en' ? item.labelEn : item.labelRu

const applyListing = (listing: Awaited<ReturnType<typeof fetchHostListingById>>) => {
  form.title = listing.title
  form.city = listing.city
  form.address = listing.address
  form.description = listing.description
  form.pricePerNight = String(listing.pricePerNight)
  form.cancellationPolicy = listing.cancellationPolicy
  form.maxGuests = String(listing.maxGuests)
  form.bedrooms = String(listing.bedrooms)
  form.houseRules = listing.houseRules
  form.checkInTime = listing.checkInTime
  form.checkOutTime = listing.checkOutTime
  form.amenities = [...listing.amenities]
  form.accommodationType = listing.accommodationType ?? ''
  form.transferOffered = listing.transferOffered
  form.transferPrice = listing.transferPrice ? String(listing.transferPrice) : ''
  form.transferPriceOnRequest = listing.transferPriceOnRequest
  form.extraGuestsOffered = listing.extraGuestsOffered
  form.maxGuestsWithExtra = listing.maxGuestsWithExtra ? String(listing.maxGuestsWithExtra) : ''
  form.extraGuestPricePerNight = listing.extraGuestPricePerNight
    ? String(listing.extraGuestPricePerNight)
    : ''
  form.contacts = listingContactsToForm(listing.contacts)
  form.metaTitle = listing.metaTitle ?? ''
  form.metaDescription = listing.metaDescription ?? ''
  form.sourceAttributionRu = listing.sourceAttributionRu ?? ''
  form.sourceAttributionEn = listing.sourceAttributionEn ?? ''
  isTeamManaged.value = listing.managedByTeam
  photos.value = listing.photos
  documents.value = listing.documents ?? []
}

const loadListing = async (id: string) => {
  loadingListing.value = true
  listingId.value = id
  error.value = ''

  try {
    applyListing(await fetchHostListingById(id))
  } catch {
    error.value = t('errors.load')
  } finally {
    loadingListing.value = false
  }
}

watch(
  () => route.query.id,
  (id) => {
    if (typeof id === 'string') {
      void loadListing(id)
    }
  },
  { immediate: true },
)

watch(
  propertyListingId,
  async (propertyId) => {
    if (!propertyId || listingId.value) {
      return
    }

    try {
      const property = await fetchPropertyForHost(propertyId)
      form.city = property.city
      form.address = property.address
    } catch {
      error.value = t('errors.load')
    }
  },
  { immediate: true },
)

const wizardSteps = computed(() => [
  { label: t('stepBasic') },
  { label: t('stepDetails') },
  { label: t('stepPhotos') },
  { label: t('stepReview') },
])

const isWizardStepEnabled = (target: number) =>
  target === 1 || Boolean(listingId.value)

const goToWizardStep = (target: number) => {
  if (!isWizardStepEnabled(target)) {
    return
  }

  step.value = target
  error.value = ''
}

const transferPayload = () => ({
  transferOffered: form.transferOffered,
  transferPriceOnRequest: form.transferOffered && form.transferPriceOnRequest,
  transferPrice: form.transferOffered && !form.transferPriceOnRequest && form.transferPrice
    ? Number(form.transferPrice)
    : null,
})

const extraGuestsPayload = () => ({
  extraGuestsOffered: form.extraGuestsOffered,
  maxGuestsWithExtra: form.extraGuestsOffered && form.maxGuestsWithExtra
    ? Number(form.maxGuestsWithExtra)
    : null,
  extraGuestPricePerNight: form.extraGuestsOffered && form.extraGuestPricePerNight
    ? Number(form.extraGuestPricePerNight)
    : null,
})

const toggleAmenity = (slug: string) => {
  if (form.amenities.includes(slug)) {
    form.amenities = form.amenities.filter(item => item !== slug)
  } else {
    form.amenities = [...form.amenities, slug]
  }
}

const apiErrorMessage = (err: unknown, fallback: string) => {
  if (
    err
    && typeof err === 'object'
    && 'data' in err
    && err.data
    && typeof err.data === 'object'
    && 'statusMessage' in err.data
    && typeof err.data.statusMessage === 'string'
    && err.data.statusMessage.trim()
  ) {
    return err.data.statusMessage
  }

  return fallback
}

const saveBasic = async () => {
  loading.value = true
  error.value = ''

  try {
    const currentId = resolveListingId()

    if (!currentId) {
      const listing = await createListing({
        title: form.title,
        city: form.city,
        address: form.address,
        description: form.description,
        pricePerNight: Number(form.pricePerNight),
        cancellationPolicy: form.cancellationPolicy,
        maxGuests: Number(form.maxGuests),
        bedrooms: Number(form.bedrooms),
        amenities: form.amenities,
        accommodationType: form.accommodationType || null,
        houseRules: form.houseRules,
        checkInTime: form.checkInTime,
        checkOutTime: form.checkOutTime,
        propertyListingId: propertyListingId.value,
        contacts: listingContactsFromForm(form.contacts),
        ...metaPayload(),
        ...sourcePayload(),
        ...transferPayload(),
        ...extraGuestsPayload(),
      })
      listingId.value = listing.id
      photos.value = listing.photos
      documents.value = listing.documents ?? []
    } else {
      await updateListing(currentId, {
        title: form.title,
        city: form.city,
        address: form.address,
        description: form.description,
        contacts: listingContactsFromForm(form.contacts),
        ...metaPayload(),
        ...sourcePayload(),
      })
    }

    step.value = 2
  } catch (err) {
    error.value = apiErrorMessage(err, t('errors.save'))
  } finally {
    loading.value = false
  }
}

const saveDetails = async () => {
  const currentId = resolveListingId()

  if (!currentId) {
    return
  }

  loading.value = true
  error.value = ''

  try {
    await updateListing(currentId, {
      pricePerNight: Number(form.pricePerNight),
      cancellationPolicy: form.cancellationPolicy,
      maxGuests: Number(form.maxGuests),
      bedrooms: Number(form.bedrooms),
      amenities: form.amenities,
      accommodationType: form.accommodationType || null,
      houseRules: form.houseRules,
      checkInTime: form.checkInTime,
      checkOutTime: form.checkOutTime,
      ...transferPayload(),
      ...extraGuestsPayload(),
    })
    step.value = 3
  } catch (err) {
    error.value = apiErrorMessage(err, t('errors.save'))
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  if (!listingId.value) {
    return
  }

  loading.value = true
  error.value = ''

  try {
    await submitListing(listingId.value)
    await navigateTo(localePath('/host/listings'))
  } catch (err) {
    error.value = apiErrorMessage(err, t('errors.submit'))
  } finally {
    loading.value = false
  }
}

const photoCount = computed(() => photos.value.filter(item => item.mediaType === 'photo').length)

const seoPreviewSource = computed(() => ({
  title: form.title,
  city: form.city,
  description: form.description,
  pricePerNight: Number(form.pricePerNight) || 0,
  maxGuests: Number(form.maxGuests) || 1,
  metaTitle: form.metaTitle,
  metaDescription: form.metaDescription,
}))

const seoPreviewTitle = computed(() =>
  buildListingMetaTitle(seoPreviewSource.value, locale.value === 'en' ? 'en' : 'ru'),
)

const seoPreviewDescription = computed(() =>
  buildListingMetaDescription(seoPreviewSource.value, locale.value === 'en' ? 'en' : 'ru'),
)

const seoPreviewImageUrl = computed(() => {
  const cover = photos.value.find(item => item.mediaType === 'photo') ?? photos.value[0]

  return cover?.url ?? null
})

const metaPayload = () => ({
  metaTitle: form.metaTitle.trim() || null,
  metaDescription: form.metaDescription.trim() || null,
})

const sourcePayload = () => (isTeamManaged.value
  ? {
      sourceAttributionRu: form.sourceAttributionRu.trim() || null,
      sourceAttributionEn: form.sourceAttributionEn.trim() || null,
    }
  : {})
</script>

<template>
  <div class="page-container max-w-2xl">
    <h1 class="section-title mb-6">
      {{ isEditing ? t('titleEdit') : t('title') }}
    </h1>

    <p
      v-if="loadingListing"
      class="mb-4 text-sm text-stone-600 dark:text-stone-400"
    >
      {{ t('loading') }}
    </p>

    <UiStepper
      class="mb-8"
      :steps="wizardSteps"
      :current="step"
      clickable
      :is-step-enabled="isWizardStepEnabled"
      @select="goToWizardStep"
    />

    <p
      v-if="error"
      class="mb-4 text-sm text-red-600 dark:text-red-400"
    >
      {{ error }}
    </p>

    <form
      v-if="step === 1"
      class="surface-card space-y-4 p-5"
      @submit.prevent="saveBasic()"
    >
      <FormInput
        v-model="form.title"
        :label="t('titleLabel')"
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
      <FormTextarea
        v-model="form.description"
        :label="t('descriptionLabel')"
      />
      <ListingContactsFields
        v-model="form.contacts"
        :title="t('contactsTitle')"
        :hint="t('contactsHint')"
      />

      <div
        v-if="isTeamManaged"
        class="space-y-3 rounded-xl border border-brand-200/80 bg-brand-50/40 p-4 dark:border-brand-800/60 dark:bg-brand-950/30"
      >
        <div>
          <p class="text-sm font-medium text-brand-900 dark:text-brand-100">
            {{ t('teamSourceTitle') }}
          </p>
          <p class="mt-1 text-xs text-brand-800/90 dark:text-brand-200/90">
            {{ t('teamSourceHint') }}
          </p>
        </div>
        <FormTextarea
          v-model="form.sourceAttributionRu"
          :label="t('teamSourceRu')"
          :rows="3"
          required
        />
        <FormTextarea
          v-model="form.sourceAttributionEn"
          :label="t('teamSourceEn')"
          :rows="2"
        />
      </div>

      <div class="space-y-3 rounded-xl border border-stone-200 p-4 dark:border-stone-700">
        <div>
          <p class="text-sm font-medium text-stone-800 dark:text-stone-200">
            {{ t('seoTitle') }}
          </p>
          <p class="mt-1 text-xs text-stone-500 dark:text-stone-400">
            {{ t('seoTitleHint') }}
          </p>
        </div>
        <FormInput
          v-model="form.metaTitle"
          :label="t('seoTitle')"
          :placeholder="t('seoTitlePlaceholder')"
        />
        <FormTextarea
          v-model="form.metaDescription"
          :label="t('seoDescription')"
          :placeholder="t('seoDescriptionPlaceholder')"
          :rows="3"
        />
        <p class="text-xs text-stone-500 dark:text-stone-400">
          {{ t('seoDescriptionHint') }}
        </p>
        <ListingSharePreview
          :title="seoPreviewTitle"
          :description="seoPreviewDescription"
          :image-url="seoPreviewImageUrl"
        />
      </div>

      <UiButton
        type="submit"
        :loading="loading"
      >
        {{ t('next') }}
      </UiButton>
    </form>

    <form
      v-else-if="step === 2"
      class="surface-card space-y-4 p-5"
      @submit.prevent="saveDetails()"
    >
      <FormInput
        v-model="form.pricePerNight"
        type="number"
        :label="t('priceLabel')"
        required
      />
      <div class="space-y-2">
        <FormLabel required>
          {{ t('cancellationPolicyLabel') }}
        </FormLabel>
        <div class="space-y-2">
          <label
            v-for="policy in CANCELLATION_POLICIES"
            :key="policy"
            class="flex cursor-pointer gap-3 rounded-xl border border-stone-200 p-3 dark:border-stone-700"
            :class="form.cancellationPolicy === policy ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30' : ''"
          >
            <input
              v-model="form.cancellationPolicy"
              type="radio"
              name="cancellationPolicy"
              :value="policy"
              class="mt-1"
            >
            <span class="text-sm text-stone-700 dark:text-stone-300">
              {{ CANCELLATION_POLICY_LABELS[policy][locale as 'ru' | 'en'] }}
            </span>
          </label>
        </div>
      </div>
      <FormInput
        v-model="form.maxGuests"
        type="number"
        min="1"
        :label="t('guestsLabel')"
        required
      />

      <div class="space-y-3 rounded-xl border border-stone-200 p-4 dark:border-stone-700">
        <p class="form-label">
          {{ t('extraGuestsTitle') }}
        </p>
        <p class="text-xs text-stone-500 dark:text-stone-400">
          {{ t('extraGuestsHint') }}
        </p>

        <label class="flex cursor-pointer items-start gap-2.5 text-sm text-stone-700 dark:text-stone-300">
          <input
            v-model="form.extraGuestsOffered"
            type="checkbox"
            class="mt-0.5 size-4 rounded border-stone-300 text-brand-700 dark:border-stone-600"
          >
          <span>{{ t('extraGuestsOffered') }}</span>
        </label>

        <template v-if="form.extraGuestsOffered">
          <FormInput
            v-model="form.maxGuestsWithExtra"
            type="number"
            min="1"
            :label="t('maxGuestsWithExtraLabel')"
            required
          />
          <FormInput
            v-model="form.extraGuestPricePerNight"
            type="number"
            min="1"
            :label="t('extraGuestPriceLabel')"
            required
          />
        </template>
      </div>

      <FormInput
        v-model="form.bedrooms"
        type="number"
        :label="t('bedroomsLabel')"
        required
      />
      <FormSelect
        v-if="accommodationTypeCatalog?.length"
        v-model="form.accommodationType"
        :options="[
          { value: '', label: t('accommodationTypePlaceholder') },
          ...accommodationTypeCatalog.map(item => ({
            value: item.slug,
            label: locale === 'en' ? item.labelEn : item.labelRu,
          })),
        ]"
        :label="t('accommodationTypeLabel')"
      />
      <FormTextarea
        v-model="form.houseRules"
        :label="t('houseRulesLabel')"
      />

      <div class="space-y-3 rounded-xl border border-stone-200 p-4 dark:border-stone-700">
        <p class="form-label">
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

      <div class="space-y-3 rounded-xl border border-stone-200 p-4 dark:border-stone-700">
        <p class="form-label">
          {{ t('transferTitle') }}
        </p>

        <label class="flex cursor-pointer items-start gap-2.5 text-sm text-stone-700 dark:text-stone-300">
          <input
            v-model="form.transferOffered"
            type="checkbox"
            class="mt-0.5 size-4 rounded border-stone-300 text-brand-700 dark:border-stone-600"
          >
          <span>{{ t('transferOffered') }}</span>
        </label>

        <template v-if="form.transferOffered">
          <label class="flex cursor-pointer items-start gap-2.5 text-sm text-stone-700 dark:text-stone-300">
            <input
              v-model="form.transferPriceOnRequest"
              type="checkbox"
              class="mt-0.5 size-4 rounded border-stone-300 text-brand-700 dark:border-stone-600"
              @change="form.transferPrice = ''"
            >
            <span>{{ t('transferOnRequest') }}</span>
          </label>

          <FormInput
            v-if="!form.transferPriceOnRequest"
            v-model="form.transferPrice"
            type="number"
            :label="t('transferPriceLabel')"
            min="1"
          />
        </template>
      </div>

      <div class="space-y-2">
        <p class="form-label">
          {{ t('amenitiesLabel') }}
        </p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="amenity in amenityCatalog ?? []"
            :key="amenity.slug"
            type="button"
            class="chip inline-flex items-center gap-1.5"
            :class="form.amenities.includes(amenity.slug) ? 'chip-active' : 'chip-inactive'"
            @click="toggleAmenity(amenity.slug)"
          >
            <Icon
              :name="amenity.icon"
              class="size-4"
            />
            {{ amenityLabel(amenity) }}
          </button>
        </div>
      </div>

      <div class="flex gap-3">
        <UiButton
          type="button"
          variant="secondary"
          @click="step = 1"
        >
          {{ t('back') }}
        </UiButton>
        <UiButton
          type="submit"
          :loading="loading"
        >
          {{ t('next') }}
        </UiButton>
      </div>
    </form>

    <div
      v-else-if="step === 3"
      class="surface-card space-y-4 p-5"
    >
      <ListingMediaUploader
        v-if="listingId"
        :listing-id="listingId"
        :photos="photos"
        :documents="documents"
        :loading="loading"
        @update:photos="photos = $event"
        @update:documents="documents = $event"
      />

      <div class="flex gap-3">
        <UiButton
          variant="secondary"
          @click="step = 2"
        >
          {{ t('back') }}
        </UiButton>
        <UiButton @click="step = 4">
          {{ t('next') }}
        </UiButton>
      </div>
    </div>

    <div
      v-else
      class="surface-card space-y-4 p-5"
    >
      <p class="text-stone-700 dark:text-stone-300">
        {{ t('saved') }}: <strong>{{ form.title }}</strong>
      </p>
      <p class="text-sm text-stone-600 dark:text-stone-400">
        {{ t('photoCount', { count: photoCount }) }}
      </p>
      <p class="text-sm text-stone-600 dark:text-stone-400">
        {{ CANCELLATION_POLICY_LABELS[form.cancellationPolicy][locale as 'ru' | 'en'] }}
      </p>

      <div class="flex gap-3">
        <UiButton
          variant="secondary"
          @click="step = 3"
        >
          {{ t('back') }}
        </UiButton>
        <UiButton
          :loading="loading"
          @click="handleSubmit()"
        >
          {{ t('submit') }}
        </UiButton>
      </div>
    </div>
  </div>
</template>
