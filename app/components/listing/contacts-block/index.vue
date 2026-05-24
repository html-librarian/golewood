<script setup lang="ts">
import { hasListingContacts } from '#shared/utils/listing-contacts'
import type { ListingContacts } from '#shared/types/listing-contacts'
import type { ListingContactsBlockProps } from './types'

const props = defineProps<ListingContactsBlockProps>()

const { t } = useI18n()

const visible = computed(() => hasListingContacts(props.contacts))

type ContactRow = {
  key: keyof ListingContacts
  href: string
  icon: string
  external: boolean
}

const rows = computed((): ContactRow[] => {
  const items: ContactRow[] = []
  const { contacts } = props

  if (contacts.phone) {
    const tel = contacts.phone.replace(/\s/g, '')
    items.push({
      key: 'phone',
      href: tel.startsWith('+') ? `tel:${tel}` : `tel:${tel}`,
      icon: 'ph:phone-duotone',
      external: false,
    })
  }

  if (contacts.website) {
    items.push({ key: 'website', href: contacts.website, icon: 'ph:globe-duotone', external: true })
  }
  if (contacts.telegram) {
    items.push({ key: 'telegram', href: contacts.telegram, icon: 'ph:telegram-logo-duotone', external: true })
  }
  if (contacts.whatsapp) {
    items.push({ key: 'whatsapp', href: contacts.whatsapp, icon: 'ph:whatsapp-logo-duotone', external: true })
  }
  if (contacts.max) {
    items.push({ key: 'max', href: contacts.max, icon: 'ph:chats-circle-duotone', external: true })
  }
  if (contacts.vk) {
    items.push({ key: 'vk', href: contacts.vk, icon: 'ph:users-three-duotone', external: true })
  }
  if (contacts.instagram) {
    items.push({ key: 'instagram', href: contacts.instagram, icon: 'ph:instagram-logo-duotone', external: true })
  }

  return items
})

const labelFor = (key: keyof ListingContacts) => t(`listingContacts.${key}`)

const displayValue = (key: keyof ListingContacts, href: string) => {
  if (key === 'phone') {
    return props.contacts.phone ?? href
  }

  try {
    const url = new URL(href)
    return url.hostname + url.pathname.replace(/\/$/, '')
  } catch {
    return href
  }
}
</script>

<template>
  <section
    v-if="visible"
    class="scroll-mt-32 space-y-4"
    data-testid="listing-contacts"
  >
    <h2 class="font-display text-xl font-semibold text-stone-900 dark:text-stone-50">
      {{ title ?? t('listingContacts.blockTitle') }}
    </h2>
    <ul class="grid gap-2 sm:grid-cols-2">
      <li
        v-for="row in rows"
        :key="row.key"
      >
        <a
          :href="row.href"
          class="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm transition hover:border-brand-300 hover:bg-brand-50/50 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-brand-700 dark:hover:bg-brand-950/30"
          :target="row.external ? '_blank' : undefined"
          :rel="row.external ? 'noopener noreferrer' : undefined"
        >
          <Icon
            :name="row.icon"
            class="size-5 shrink-0 text-brand-600 dark:text-brand-400"
          />
          <span class="min-w-0">
            <span class="block text-xs font-medium text-stone-500 dark:text-stone-400">
              {{ labelFor(row.key) }}
            </span>
            <span class="block truncate font-medium text-stone-900 dark:text-stone-100">
              {{ displayValue(row.key, row.href) }}
            </span>
          </span>
        </a>
      </li>
    </ul>
  </section>
</template>
