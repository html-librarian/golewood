<script setup lang="ts">
import { homePromoUsesImageBackground } from '#shared/utils/home-promo-display'
import { isExternalPromoHref, resolveHomePromoHref } from '#shared/utils/home-promo-link'
import type { HomePromoBannerProps } from './types'

const props = defineProps<HomePromoBannerProps>()

const { locale } = useI18n()
const localePath = useLocalePath()

const title = computed(() => (locale.value === 'en' ? props.banner.titleEn : props.banner.titleRu) || '')
const subtitle = computed(() => (locale.value === 'en' ? props.banner.subtitleEn : props.banner.subtitleRu) || '')
const cta = computed(() => (locale.value === 'en' ? props.banner.ctaEn : props.banner.ctaRu) || '')

const href = computed(() => resolveHomePromoHref(props.banner, localePath))
const external = computed(() => props.banner.linkExternal || isExternalPromoHref(props.banner.linkHref))

const showImageBackground = computed(() => homePromoUsesImageBackground(props.banner))

const fallbackSrc = computed(() =>
  props.banner.imageMobileUrl
  || props.banner.imageTabletUrl
  || props.banner.imageDesktopUrl
  || '',
)

const shellClass = computed(() => {
  const size = props.variant === 'featured'
    ? 'min-h-44 sm:min-h-50 lg:min-h-60'
    : 'min-h-44 sm:min-h-48 lg:min-h-60'

  return [
    'group relative flex size-full min-w-0 cursor-pointer overflow-hidden rounded-2xl shadow-md ring-1 ring-black/10 transition hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:ring-white/10 dark:focus-visible:ring-offset-stone-950',
    props.variant === 'carousel' ? 'absolute inset-0' : '',
    size,
  ]
})
</script>

<template>
  <NuxtLink
    v-if="!external"
    :to="href"
    :class="shellClass"
  >
    <div
      v-if="showImageBackground"
      class="absolute inset-0"
    >
      <picture>
        <source
          v-if="banner.imageDesktopUrl"
          media="(min-width: 1024px)"
          :srcset="banner.imageDesktopUrl"
        >
        <source
          v-if="banner.imageTabletUrl || banner.imageDesktopUrl"
          media="(min-width: 768px)"
          :srcset="banner.imageTabletUrl || banner.imageDesktopUrl || undefined"
        >
        <img
          :src="fallbackSrc"
          alt=""
          class="size-full object-cover transition duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        >
      </picture>
    </div>
    <div
      v-else
      class="absolute inset-0 bg-linear-to-br"
      :class="banner.tone"
    />

    <div class="absolute inset-0 bg-linear-to-t from-black/70 via-black/25 to-black/10" />

    <div class="relative flex h-full flex-col justify-end p-4 sm:p-5 md:p-6">
      <p
        v-if="subtitle"
        class="text-xs font-medium uppercase tracking-wide text-white/85 sm:text-sm"
      >
        {{ subtitle }}
      </p>
      <p
        v-if="title"
        class="mt-1 font-display text-lg font-semibold leading-tight text-white drop-shadow-sm sm:text-xl md:text-2xl"
        :class="variant === 'featured' ? 'md:text-3xl' : ''"
      >
        {{ title }}
      </p>
      <span
        v-if="cta"
        class="mt-3 inline-flex w-fit items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-stone-900 shadow-sm transition group-hover:bg-brand-50"
      >
        {{ cta }}
      </span>
    </div>
  </NuxtLink>
  <a
    v-else
    :href="href"
    target="_blank"
    rel="noopener noreferrer"
    :class="shellClass"
  >
    <div
      v-if="showImageBackground"
      class="absolute inset-0"
    >
      <picture>
        <source
          v-if="banner.imageDesktopUrl"
          media="(min-width: 1024px)"
          :srcset="banner.imageDesktopUrl"
        >
        <source
          v-if="banner.imageTabletUrl || banner.imageDesktopUrl"
          media="(min-width: 768px)"
          :srcset="banner.imageTabletUrl || banner.imageDesktopUrl || undefined"
        >
        <img
          :src="fallbackSrc"
          alt=""
          class="size-full object-cover transition duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        >
      </picture>
    </div>
    <div
      v-else
      class="absolute inset-0 bg-linear-to-br"
      :class="banner.tone"
    />

    <div class="absolute inset-0 bg-linear-to-t from-black/70 via-black/25 to-black/10" />

    <div class="relative flex h-full flex-col justify-end p-4 sm:p-5 md:p-6">
      <p
        v-if="subtitle"
        class="text-xs font-medium uppercase tracking-wide text-white/85 sm:text-sm"
      >
        {{ subtitle }}
      </p>
      <p
        v-if="title"
        class="mt-1 font-display text-lg font-semibold leading-tight text-white drop-shadow-sm sm:text-xl md:text-2xl"
        :class="variant === 'featured' ? 'md:text-3xl' : ''"
      >
        {{ title }}
      </p>
      <span
        v-if="cta"
        class="mt-3 inline-flex w-fit items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-stone-900 shadow-sm transition group-hover:bg-brand-50"
      >
        {{ cta }}
      </span>
    </div>
  </a>
</template>
