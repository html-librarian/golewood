<script setup lang="ts">
import type { PromotionProductSlug } from '#shared/types/promotion'
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({
  layout: 'host',
  middleware: 'auth',
  pageTransition: false,
})

const route = useRoute()
const listingId = computed(() => String(route.params.id))
const { t, locale } = usePageI18n({ ru, en })
const localePath = useLocalePath()
const { fetchListingPromotions, purchasePromotion } = useHostPromo()

const purchasingSlug = ref<PromotionProductSlug | null>(null)
const successMessage = ref<string | null>(null)

const { data, pending, refresh, error } = await useAsyncData(
  () => `host-listing-promotions-${listingId.value}`,
  () => fetchListingPromotions(listingId.value),
)

const activeSlugs = computed(() => new Set((data.value?.active ?? []).map(item => item.productSlug)))

const formatEndsAt = (iso: string) =>
  new Date(iso).toLocaleDateString(locale.value === 'en' ? 'en-GB' : 'ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

const handlePurchase = async (slug: PromotionProductSlug, price: number) => {
  if (!data.value || data.value.balance < price) {
    return
  }

  purchasingSlug.value = slug
  successMessage.value = null

  try {
    await purchasePromotion(listingId.value, { productSlug: slug })
    successMessage.value = t('purchased')
    await refresh()
  } finally {
    purchasingSlug.value = null
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

    <section
      v-if="pending"
      class="surface-card space-y-3 p-5"
    >
      <UiSkeleton variant="title" />
      <UiSkeleton class="h-24 w-full" />
    </section>

    <template v-else-if="data">
      <p class="text-sm font-medium text-brand-700 dark:text-brand-400">
        {{ t('balance', { balance: data.balance }) }}
      </p>

      <p
        v-if="successMessage"
        class="rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
        data-testid="promotion-success"
      >
        {{ successMessage }}
      </p>

      <section class="surface-card space-y-3 p-5">
        <h2 class="font-display text-lg font-semibold text-stone-900 dark:text-stone-50">
          {{ t('activeTitle') }}
        </h2>
        <UiEmpty
          v-if="!data.active.length"
          icon="ph:megaphone-duotone"
          :title="t('emptyActive')"
        />
        <ul
          v-else
          class="space-y-2"
        >
          <li
            v-for="promo in data.active"
            :key="promo.id"
            class="rounded-lg border border-stone-200/80 px-3 py-2 text-sm dark:border-stone-700"
          >
            <span class="font-medium text-stone-900 dark:text-stone-50">
              {{ data.products.find(p => p.slug === promo.productSlug)?.[locale === 'en' ? 'titleEn' : 'titleRu'] }}
            </span>
            <span class="text-stone-500 dark:text-stone-400">
              · {{ $t('promotion.activeUntil', { date: formatEndsAt(promo.endsAt) }) }}
            </span>
          </li>
        </ul>
      </section>

      <section class="space-y-4">
        <h2 class="font-display text-lg font-semibold text-stone-900 dark:text-stone-50">
          {{ t('catalogTitle') }}
        </h2>
        <article
          v-for="product in data.products"
          :key="product.slug"
          class="surface-card space-y-3 p-5"
        >
          <h3 class="font-semibold text-stone-900 dark:text-stone-50">
            {{ locale === 'en' ? product.titleEn : product.titleRu }}
          </h3>
          <p class="text-sm text-stone-600 dark:text-stone-400">
            {{ locale === 'en' ? product.descriptionEn : product.descriptionRu }}
          </p>
          <UiButton
            v-if="!activeSlugs.has(product.slug)"
            :disabled="data.balance < product.pricePoints || purchasingSlug === product.slug"
            @click="handlePurchase(product.slug, product.pricePoints)"
          >
            {{
              purchasingSlug === product.slug
                ? t('purchasing')
                : t('purchase', { price: product.pricePoints })
            }}
          </UiButton>
          <p
            v-else
            class="text-sm font-medium text-stone-500 dark:text-stone-400"
          >
            {{ t('alreadyActive') }}
          </p>
          <div
            v-if="data.balance < product.pricePoints && !activeSlugs.has(product.slug)"
            class="space-y-2"
          >
            <p class="text-sm text-accent-700 dark:text-accent-400">
              {{ $t('promotion.insufficientBalance') }}
            </p>
            <NuxtLink :to="localePath('/host/promo#buy')">
              <UiButton
                size="sm"
                variant="secondary"
              >
                {{ t('buyPoints') }}
              </UiButton>
            </NuxtLink>
          </div>
        </article>
      </section>
    </template>
  </div>
</template>
