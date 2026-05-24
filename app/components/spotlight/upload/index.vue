<script setup lang="ts">
import type { SpotlightUploadEmits, SpotlightUploadProps } from './types'
import ru from './i18n/ru'
import en from './i18n/en'

const props = defineProps<SpotlightUploadProps>()
const emit = defineEmits<SpotlightUploadEmits>()

const { t } = usePageI18n({ ru, en })
const localePath = useLocalePath()
const { isAuthenticated } = useAuth()
const { uploadPhoto } = useSpotlight()

type SourceMode = 'listing' | 'external'

const sourceMode = ref<SourceMode>('listing')
const listingUrl = ref(props.listingId ? `${localePath(`/listings/${props.listingId}`)}` : '')
const placeName = ref('')
const externalSiteUrl = ref('')
const externalInstagram = ref('')
const caption = ref('')
const consent = ref(false)
const file = ref<File | null>(null)
const loading = ref(false)
const error = ref('')
const success = ref(false)

watch(() => props.listingId, (id) => {
  if (id) {
    sourceMode.value = 'listing'
    listingUrl.value = localePath(`/listings/${id}`)
  }
})

const onFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  file.value = input.files?.[0] ?? null
}

const hasListingLink = computed(() => listingUrl.value.trim().length > 0)
const hasExternalLink = computed(() =>
  externalSiteUrl.value.trim().length > 0 || externalInstagram.value.trim().length > 0,
)

const canSubmit = computed(() => {
  if (!consent.value || !file.value) {
    return false
  }

  if (sourceMode.value === 'listing') {
    return hasListingLink.value
  }

  return hasExternalLink.value
})

const submit = async () => {
  if (!isAuthenticated.value) {
    await navigateTo(localePath('/auth/login'))
    return
  }

  if (!canSubmit.value) {
    error.value = t('uploadError')
    return
  }

  loading.value = true
  error.value = ''
  success.value = false

  try {
    const formData = new FormData()
    formData.append('consent', 'true')
    formData.append('caption', caption.value.trim())
    formData.append('file', file.value!)

    if (sourceMode.value === 'listing') {
      if (props.listingId) {
        formData.append('listingId', props.listingId)
      }
      formData.append('listingUrl', listingUrl.value.trim())
    } else {
      formData.append('placeName', placeName.value.trim())
      formData.append('externalSiteUrl', externalSiteUrl.value.trim())
      formData.append('externalInstagram', externalInstagram.value.trim())
    }

    await uploadPhoto(formData)
    success.value = true
    caption.value = ''
    file.value = null
    consent.value = false
    externalSiteUrl.value = ''
    externalInstagram.value = ''
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
    <p class="text-sm text-stone-600 dark:text-stone-400">
      {{ isAuthenticated ? t('uploadHint') : t('loginHint') }}
    </p>

    <p
      v-if="success"
      class="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800 dark:bg-green-950 dark:text-green-200"
    >
      {{ t('uploadSuccess') }}
    </p>

    <template v-if="isAuthenticated">
      <div class="flex flex-wrap gap-2">
        <UiButton
          type="button"
          size="sm"
          :variant="sourceMode === 'listing' ? 'primary' : 'secondary'"
          @click="sourceMode = 'listing'"
        >
          {{ t('sourceListing') }}
        </UiButton>
        <UiButton
          type="button"
          size="sm"
          :variant="sourceMode === 'external' ? 'primary' : 'secondary'"
          @click="sourceMode = 'external'"
        >
          {{ t('sourceExternal') }}
        </UiButton>
      </div>

      <template v-if="sourceMode === 'listing'">
        <FormInput
          v-model="listingUrl"
          :label="t('listingUrl')"
          :placeholder="t('listingUrlPlaceholder')"
          :disabled="Boolean(props.listingId)"
          required
        />
        <p class="text-xs text-stone-500 dark:text-stone-400">
          {{ t('listingUrlHint') }}
        </p>
      </template>

      <template v-else>
        <FormInput
          v-model="placeName"
          :label="t('placeName')"
          :placeholder="t('placeNamePlaceholder')"
        />
        <FormInput
          v-model="externalSiteUrl"
          :label="t('externalSite')"
          :placeholder="t('externalSitePlaceholder')"
          type="url"
        />
        <FormInput
          v-model="externalInstagram"
          :label="t('externalInstagram')"
          :placeholder="t('externalInstagramPlaceholder')"
        />
        <p class="text-xs text-stone-500 dark:text-stone-400">
          {{ t('externalHint') }}
        </p>
      </template>

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
        :disabled="!canSubmit"
      >
        {{ t('submit') }}
      </UiButton>
    </template>

    <NuxtLink
      v-else
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
