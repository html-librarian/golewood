<script setup lang="ts">
const localePath = useLocalePath()
</script>

<template>
  <footer class="footer-canopy mt-auto bg-stone-950 text-stone-300">
    <UiForestDivider
      flip
      tone="forest"
      class="relative -mt-px"
    />
    <div class="layout-container flex flex-col gap-10 border-t border-stone-800 py-12 lg:flex-row lg:justify-between lg:py-14">
      <div class="max-w-sm space-y-4">
        <NuxtLink
          :to="localePath('/')"
          class="group inline-flex items-center gap-2.5"
        >
          <span class="flex size-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-lg shadow-brand-900/30 transition group-hover:bg-brand-500">
            <Icon
              name="ph:tree-evergreen-duotone"
              class="size-5"
            />
          </span>
          <span class="font-display text-xl font-semibold text-white">
            Golewood
          </span>
        </NuxtLink>
        <p class="text-sm leading-relaxed text-stone-400">
          {{ $t('footer.tagline') }}
        </p>
      </div>

      <div class="grid gap-8 sm:grid-cols-2 md:grid-cols-3">
        <div class="space-y-3">
          <p class="editorial-kicker editorial-kicker-leaf text-brand-400/90">
            {{ $t('footer.help') }}
          </p>
          <div class="flex flex-col gap-2 text-sm">
            <NuxtLink
              :to="localePath('/help')"
              class="text-stone-400 transition hover:text-white"
            >
              {{ $t('help.nav.overview') }}
            </NuxtLink>
            <NuxtLink
              :to="localePath('/help/faq')"
              class="text-stone-400 transition hover:text-white"
            >
              {{ $t('help.nav.faq') }}
            </NuxtLink>
            <NuxtLink
              :to="localePath('/help/support')"
              class="text-stone-400 transition hover:text-white"
            >
              {{ $t('help.nav.support') }}
            </NuxtLink>
          </div>
        </div>

        <div class="space-y-3">
          <p class="editorial-kicker editorial-kicker-leaf text-brand-400/90">
            {{ $t('footer.legal') }}
          </p>
          <div class="flex flex-col gap-2 text-sm">
            <NuxtLink
              :to="localePath('/legal/requisites')"
              class="text-stone-400 transition hover:text-white"
            >
              {{ $t('legal.nav.requisites') }}
            </NuxtLink>
            <NuxtLink
              :to="localePath('/legal/offer')"
              class="text-stone-400 transition hover:text-white"
            >
              {{ $t('legal.nav.offer') }}
            </NuxtLink>
            <NuxtLink
              :to="localePath('/legal/privacy')"
              class="text-stone-400 transition hover:text-white"
            >
              {{ $t('legal.nav.privacy') }}
            </NuxtLink>
            <NuxtLink
              :to="localePath('/legal/terms')"
              class="text-stone-400 transition hover:text-white"
            >
              {{ $t('legal.nav.terms') }}
            </NuxtLink>
          </div>
        </div>

        <div class="space-y-3">
          <p class="editorial-kicker editorial-kicker-leaf text-brand-400/90">
            {{ $t('footer.service') }}
          </p>
          <div class="flex flex-col gap-2 text-sm">
            <NuxtLink
              :to="localePath('/search')"
              class="text-stone-400 transition hover:text-white"
            >
              {{ $t('common.search') }}
            </NuxtLink>
            <NuxtLink
              :to="localePath('/blog')"
              class="text-stone-400 transition hover:text-white"
            >
              {{ $t('blog.link') }}
            </NuxtLink>
            <NuxtLink
              :to="localePath('/spotlight')"
              class="text-stone-400 transition hover:text-white"
            >
              {{ $t('spotlight.link') }}
            </NuxtLink>
            <NuxtLink
              :to="localePath('/auth/login')"
              class="text-stone-400 transition hover:text-white"
            >
              {{ $t('common.login') }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <div class="border-t border-stone-800/80 px-4 py-5 text-center text-xs text-stone-400">
      © {{ new Date().getFullYear() }} Golewood
    </div>
  </footer>
</template>
