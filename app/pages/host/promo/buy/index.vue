<script setup lang="ts">
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({
  layout: 'host',
  middleware: 'auth',
  pageTransition: false,
})

const { t } = usePageI18n({ ru, en })
const route = useRoute()
const localePath = useLocalePath()
const { fetchPointsPurchase } = useHostPromo()

const purchaseId = computed(() => {
  const value = route.query.purchase
  return typeof value === 'string' ? value : ''
})

const sync = computed(() => route.query.return === '1')

const { data: purchase, pending, refresh } = await useAsyncData(
  () => `host-promo-purchase-${purchaseId.value}-${sync.value}`,
  () => (purchaseId.value ? fetchPointsPurchase(purchaseId.value, sync.value) : Promise.resolve(null)),
  { watch: [purchaseId, sync] },
)

const isSuccess = computed(() => purchase.value?.status === 'succeeded')
const isPending = computed(() => purchase.value?.status === 'pending')
</script>

<template>
  <div class="page-container max-w-lg space-y-6">
    <h1 class="section-title">
      {{ t('title') }}
    </h1>

    <section
      v-if="pending"
      class="surface-card p-5"
    >
      <UiSkeleton variant="title" />
      <UiSkeleton class="mt-3 w-2/3" />
    </section>

    <template v-else-if="purchase">
      <p
        v-if="isSuccess"
        class="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
        data-testid="promo-purchase-success"
      >
        {{ t('success') }}
        · {{ t('pointsCredited', { points: purchase.points }) }}
      </p>
      <p
        v-else-if="isPending"
        class="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950/50 dark:text-amber-200"
      >
        {{ t('pending') }}
      </p>
      <p
        v-else
        class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950/50 dark:text-red-200"
      >
        {{ t('failed') }}
      </p>

      <UiButton
        v-if="isPending"
        variant="secondary"
        @click="refresh()"
      >
        {{ t('refresh') }}
      </UiButton>
    </template>

    <NuxtLink
      :to="localePath('/host/promo')"
      class="inline-flex text-sm font-medium text-brand-700 hover:underline dark:text-brand-400"
    >
      {{ t('backToPromo') }}
    </NuxtLink>
  </div>
</template>
