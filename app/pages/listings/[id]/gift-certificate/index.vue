<script setup lang="ts">
import { formatPrice } from '#shared/utils/format'
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({ middleware: 'auth', pageTransition: false })

const route = useRoute()
const localePath = useLocalePath()
const { t } = usePageI18n({ ru, en })
const { isAuthenticated } = useAuth()
const { fetchPublishedById } = useListings()
const { fetchListingOffers, createPurchase } = useGiftCertificates()

const listingId = computed(() => String(route.params.id))
const selectedOfferId = ref<string | null>(null)
const recipientName = ref('')
const buying = ref(false)
const buyError = ref('')

const { data: listing, pending: listingPending } = await useAsyncData(
  () => `gift-listing-${listingId.value}`,
  () => fetchPublishedById(listingId.value),
)

const { data: offers, pending: offersPending } = await useAsyncData(
  () => `gift-offers-${listingId.value}`,
  () => fetchListingOffers(listingId.value),
)

watch(offers, (value) => {
  if (value?.length && !selectedOfferId.value) {
    selectedOfferId.value = value[0].id
  }
}, { immediate: true })

const handleBuy = async () => {
  if (!selectedOfferId.value) {
    return
  }

  buying.value = true
  buyError.value = ''

  try {
    const result = await createPurchase({
      offerId: selectedOfferId.value,
      recipientName: recipientName.value.trim() || undefined,
    })

    await navigateTo(localePath(`/gift-certificates/purchases/${result.purchase.id}/pay`))
  } catch (error: unknown) {
    const err = error as { data?: { code?: string, statusMessage?: string } }
    const payoutBlocked = err.data?.code === 'HOST_PAYOUT_NOT_READY'
      || err.data?.statusMessage === 'HOST_PAYOUT_NOT_READY'
    buyError.value = payoutBlocked ? t('hostPayoutNotReady') : t('purchaseFailed')
  } finally {
    buying.value = false
  }
}
</script>

<template>
  <div class="page-container max-w-lg space-y-8 pb-16">
    <NuxtLink
      :to="localePath(`/listings/${listingId}`)"
      class="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline dark:text-brand-400"
    >
      <Icon
        name="ph:arrow-left"
        class="size-4"
      />
      {{ t('back') }}
    </NuxtLink>

    <header class="space-y-1">
      <h1 class="section-title">
        {{ t('title') }}
      </h1>
      <p class="text-sm text-stone-600 dark:text-stone-400">
        {{ t('subtitle') }}
      </p>
      <p
        v-if="listing"
        class="text-sm font-medium text-stone-800 dark:text-stone-200"
      >
        {{ listing.title }} · {{ listing.city }}
      </p>
    </header>

    <UiSkeleton
      v-if="listingPending || offersPending"
      class="h-40 w-full"
    />

    <UiEmpty
      v-else-if="!offers?.length"
      icon="ph:gift-duotone"
      :title="t('noOffers')"
    />

    <template v-else>
      <ul class="space-y-2">
        <li
          v-for="offer in offers"
          :key="offer.id"
        >
          <label
            class="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 dark:border-stone-700 dark:bg-stone-950"
            :class="selectedOfferId === offer.id ? 'border-brand-500 ring-1 ring-brand-500/30' : ''"
          >
            <span class="font-semibold text-stone-900 dark:text-stone-100">
              {{ formatPrice(offer.amountRub) }}
            </span>
            <input
              v-model="selectedOfferId"
              type="radio"
              class="size-4 border-stone-300 text-brand-600"
              :value="offer.id"
            >
          </label>
        </li>
      </ul>

      <FormInput
        v-model="recipientName"
        :label="t('recipientLabel')"
        :placeholder="t('recipientPlaceholder')"
      />

      <p
        v-if="!isAuthenticated"
        class="text-sm text-stone-600 dark:text-stone-400"
      >
        {{ t('loginRequired') }}
      </p>

      <UiButton
        class="w-full"
        :loading="buying"
        :disabled="!isAuthenticated || !selectedOfferId"
        @click="handleBuy()"
      >
        {{ t('buy') }}
      </UiButton>

      <p
        v-if="buyError"
        class="text-sm text-red-600 dark:text-red-400"
      >
        {{ buyError }}
      </p>
    </template>
  </div>
</template>
