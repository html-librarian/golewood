<script setup lang="ts">
import { LISTING_CLAIM_ATTACHMENT_MAX_COUNT } from '#shared/utils/media-limits'
import type { ListingClaimAccessPropsWithLabels } from './types'

const props = defineProps<ListingClaimAccessPropsWithLabels>()

const name = ref('')
const phone = ref('')
const email = ref('')
const message = ref('')
const attachments = ref<File[]>([])
const loading = ref(false)
const error = ref('')
const success = ref(false)

const resetForm = () => {
  name.value = ''
  phone.value = ''
  email.value = ''
  message.value = ''
  attachments.value = []
}

const submitClaim = async () => {
  loading.value = true
  error.value = ''
  success.value = false

  try {
    const formData = new FormData()
    formData.append('name', name.value.trim())
    formData.append('phone', phone.value.trim())

    const emailValue = email.value.trim()

    if (emailValue) {
      formData.append('email', emailValue)
    }

    const messageValue = message.value.trim()

    if (messageValue) {
      formData.append('message', messageValue)
    }

    for (const file of attachments.value) {
      formData.append('files', file)
    }

    await $fetch(`/api/listings/${props.listingId}/claim-request`, {
      method: 'POST',
      body: formData,
    })

    success.value = true
    resetForm()
  } catch {
    error.value = props.labels.error
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="surface-card space-y-4 p-5">
    <div class="space-y-2">
      <UiBadge variant="muted">
        {{ labels.teamBadge }}
      </UiBadge>
      <h2 class="font-display text-lg font-semibold text-stone-900 dark:text-stone-50">
        {{ labels.title }}
      </h2>
      <p class="text-sm leading-relaxed text-stone-600 dark:text-stone-400">
        {{ labels.subtitle }}
      </p>
    </div>

    <p
      v-if="success"
      class="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800 dark:bg-green-950 dark:text-green-200"
    >
      {{ labels.success }}
    </p>

    <form
      v-else
      class="space-y-4"
      @submit.prevent="submitClaim"
    >
      <div class="grid w-full gap-4 sm:grid-cols-3">
        <FormInput
          :id="`claim-name-${listingId}`"
          v-model="name"
          :label="labels.name"
          autocomplete="name"
          required
        />
        <FormInput
          :id="`claim-phone-${listingId}`"
          v-model="phone"
          :label="labels.phone"
          type="tel"
          placeholder="+79001234567"
          autocomplete="tel"
          required
        />
        <FormInput
          :id="`claim-email-${listingId}`"
          v-model="email"
          :label="labels.email"
          type="email"
          autocomplete="email"
        />
      </div>

      <FormTextarea
        v-model="message"
        :label="labels.message"
        :rows="3"
      />

      <FormFilePicker
        :id="`claim-files-${listingId}`"
        v-model="attachments"
        :label="labels.attachments"
        :hint="labels.attachmentsHint"
        :max-files="LISTING_CLAIM_ATTACHMENT_MAX_COUNT"
        :disabled="loading"
        accept=".pdf,.doc,.docx,image/jpeg,image/png,image/webp"
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
        {{ labels.submit }}
      </UiButton>
    </form>
  </section>
</template>
