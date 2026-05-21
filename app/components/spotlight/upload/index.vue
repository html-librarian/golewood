<script setup lang="ts">
import type { BookingWithListing } from '#shared/types/booking'
import type { SpotlightUploadEmits, SpotlightUploadProps } from './types'
import ru from './i18n/ru'
import en from './i18n/en'

const props = defineProps<SpotlightUploadProps>()
const emit = defineEmits<SpotlightUploadEmits>()

const { t } = usePageI18n({ ru, en })
const localePath = useLocalePath()
const { isAuthenticated } = useAuth()
const { fetchGuestBookings } = useBookings()
const { uploadPhoto } = useSpotlight()

const listingId = ref(props.listingId ?? '')
const caption = ref('')
const consent = ref(false)
const file = ref<File | null>(null)
const loading = ref(false)
const error = ref('')
const success = ref(false)

const { data: bookings, pending: bookingsPending } = await useAsyncData(
  'spotlight-upload-bookings',
  async () => {
    if (!isAuthenticated.value) {
      return [] as BookingWithListing[]
    }

    try {
      return await fetchGuestBookings()
    } catch {
      return [] as BookingWithListing[]
    }
  },
  { watch: [isAuthenticated], default: () => [] as BookingWithListing[] },
)

const listingOptions = computed(() => {
  const map = new Map<string, { value: string, label: string }>()

  for (const booking of bookings.value ?? []) {
    if (booking.status === 'cancelled') {
      continue
    }

    map.set(booking.listing.id, {
      value: booking.listing.id,
      label: `${booking.listing.title} — ${booking.listing.city}`,
    })
  }

  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label, 'ru'))
})

const hasListingChoice = computed(() => listingOptions.value.length > 0)

const canShowUploadForm = computed(() =>
  isAuthenticated.value
  && !bookingsPending.value
  && hasListingChoice.value,
)

const introText = computed(() => {
  if (canShowUploadForm.value) {
    return t('uploadHint')
  }

  if (!isAuthenticated.value) {
    return t('loginHint')
  }

  return ''
})

const syncListingSelection = () => {
  const options = listingOptions.value

  if (props.listingId && options.some(option => option.value === props.listingId)) {
    listingId.value = props.listingId
    return
  }

  if (!listingId.value && options.length === 1) {
    listingId.value = options[0]!.value
  }
}

watch(listingOptions, syncListingSelection, { immediate: true })

const onFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  file.value = input.files?.[0] ?? null
}

const submit = async () => {
  if (!isAuthenticated.value) {
    await navigateTo(localePath('/auth/login'))
    return
  }

  if (!listingId.value.trim() || !file.value || !consent.value) {
    error.value = t('uploadError')
    return
  }

  loading.value = true
  error.value = ''
  success.value = false

  try {
    const formData = new FormData()
    formData.append('listingId', listingId.value.trim())
    formData.append('caption', caption.value.trim())
    formData.append('consent', 'true')
    formData.append('file', file.value)

    await uploadPhoto(formData)
    success.value = true
    caption.value = ''
    file.value = null
    consent.value = false
    emit('uploaded')
  } catch {
    error.value = t('uploadFailed')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <form
    class="surface-card space-y-4 p-5"
    @submit.prevent="submit()"
  >
    <h2 class="font-display text-xl font-semibold text-stone-900 dark:text-stone-50">
      {{ t('uploadTitle') }}
    </h2>
    <p
      v-if="introText"
      class="text-sm text-stone-600 dark:text-stone-400"
    >
      {{ introText }}
    </p>

    <p
      v-if="success"
      class="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800 dark:bg-green-950 dark:text-green-200"
    >
      {{ t('uploadSuccess') }}
    </p>

    <FormSelect
      v-if="hasListingChoice"
      :id="'spotlight-listing'"
      v-model="listingId"
      :label="t('listing')"
      :options="listingOptions"
      :placeholder="t('listingPlaceholder')"
      :disabled="Boolean(props.listingId && listingOptions.some(option => option.value === props.listingId))"
      required
    />

    <div
      v-else-if="isAuthenticated && !bookingsPending"
      class="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700 dark:border-stone-700 dark:bg-stone-900/50 dark:text-stone-300"
    >
      <p>{{ t('noBookings') }}</p>
      <NuxtLink
        :to="localePath('/search')"
        class="mt-2 inline-block font-medium text-brand-700 hover:underline dark:text-brand-400"
      >
        {{ t('findListing') }}
      </NuxtLink>
    </div>

    <div
      v-else-if="bookingsPending"
      class="space-y-2"
    >
      <UiSkeleton class="h-4 w-24" />
      <UiSkeleton class="h-11 w-full" />
    </div>

    <template v-if="canShowUploadForm">
      <FormTextarea
        v-model="caption"
        :label="t('caption')"
        :rows="2"
      />

      <div>
        <FormLabel required>
          {{ t('photo') }}
        </FormLabel>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          class="form-file mt-1"
          :aria-label="t('photo')"
          @change="onFileChange"
        >
      </div>

      <FormCheckbox
        v-model="consent"
        :label="t('consent')"
      />

      <p
        v-if="error"
        class="text-sm text-red-600 dark:text-red-400"
      >
        {{ error }}
      </p>

      <UiButton
        type="submit"
        :loading="loading"
      >
        {{ t('submit') }}
      </UiButton>
    </template>

    <NuxtLink
      v-else-if="!isAuthenticated"
      :to="localePath('/auth/login')"
      class="block"
    >
      <UiButton
        type="button"
        class="w-full"
      >
        {{ t('loginToUpload') }}
      </UiButton>
    </NuxtLink>
  </form>
</template>
