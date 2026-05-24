<script setup lang="ts">
import type { ListingContactsFieldsProps } from './types'

defineProps<ListingContactsFieldsProps>()

const model = defineModel<{
  phone: string
  website: string
  telegram: string
  whatsapp: string
  max: string
  vk: string
  instagram: string
}>({ required: true })

const { t } = useI18n()
</script>

<template>
  <div class="space-y-3 rounded-xl border border-stone-200 p-4 dark:border-stone-700">
    <div>
      <p class="text-sm font-medium text-stone-800 dark:text-stone-200">
        {{ title ?? t('listingContacts.title') }}
      </p>
      <p class="mt-1 text-xs text-stone-500 dark:text-stone-400">
        {{ hint ?? t('listingContacts.hint') }}
      </p>
    </div>

    <FormInput
      v-model="model.phone"
      type="tel"
      autocomplete="tel"
      :label="t('listingContacts.phone')"
      :placeholder="t('listingContacts.phonePlaceholder')"
    />
    <FormInput
      v-model="model.website"
      type="url"
      :label="t('listingContacts.website')"
      :placeholder="t('listingContacts.websitePlaceholder')"
    />
    <div class="grid gap-3 sm:grid-cols-2">
      <FormInput
        v-model="model.telegram"
        :label="t('listingContacts.telegram')"
        :placeholder="t('listingContacts.telegramPlaceholder')"
      />
      <FormInput
        v-model="model.whatsapp"
        :label="t('listingContacts.whatsapp')"
        :placeholder="t('listingContacts.whatsappPlaceholder')"
      />
      <FormInput
        v-model="model.max"
        :label="t('listingContacts.max')"
        :placeholder="t('listingContacts.maxPlaceholder')"
      />
      <FormInput
        v-model="model.vk"
        :label="t('listingContacts.vk')"
        :placeholder="t('listingContacts.vkPlaceholder')"
      />
    </div>
    <FormInput
      v-model="model.instagram"
      :label="t('listingContacts.instagram')"
      :placeholder="t('listingContacts.instagramPlaceholder')"
    />
  </div>
</template>
