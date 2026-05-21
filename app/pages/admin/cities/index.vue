<script setup lang="ts">
import { CATALOG_COUNTRIES } from '#shared/catalog/countries'
import type { CatalogCountryCode } from '#shared/catalog/countries'
import ru from './i18n/ru'
import en from './i18n/en'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
  staffRoles: ['admin', 'content_manager'],
})

const { t, locale } = usePageI18n({ ru, en })
const { fetchAdminCities, createCity, updateCity } = useCatalog()

const selectedCountry = ref<CatalogCountryCode>('RU')

const { data: cities, refresh, pending } = await useAsyncData(
  'admin-cities',
  () => fetchAdminCities(selectedCountry.value),
  { watch: [selectedCountry] },
)

const form = reactive({
  name: '',
  nameEn: '',
})

const saving = ref(false)
const contentLocale = ref<'ru' | 'en'>('ru')

const countryLabel = (code: CatalogCountryCode) => {
  const row = CATALOG_COUNTRIES.find(c => c.code === code)

  if (!row) {
    return code
  }

  return locale.value === 'en' ? row.nameEn : row.nameRu
}

const countryOptions = computed(() =>
  CATALOG_COUNTRIES.map(country => ({
    value: country.code,
    label: countryLabel(country.code),
  })),
)

const cityCount = computed(() => cities.value?.length ?? 0)

const addCity = async () => {
  if (!form.name.trim()) {
    return
  }

  saving.value = true

  try {
    await createCity({
      name: form.name.trim(),
      nameEn: form.nameEn.trim() || undefined,
      countryCode: selectedCountry.value,
      active: true,
      sortOrder: cityCount.value + 1,
    })
    form.name = ''
    form.nameEn = ''
    await refresh()
  } finally {
    saving.value = false
  }
}

const toggleActive = async (id: string, active: boolean) => {
  await updateCity(id, { active: !active })
  await refresh()
}
</script>

<template>
  <div class="page-container max-w-3xl space-y-8">
    <header class="space-y-1">
      <h1 class="section-title">
        {{ t('title') }}
      </h1>
      <p class="text-sm text-stone-600 dark:text-stone-400">
        {{ t('subtitle') }}
      </p>
    </header>

    <section class="surface-card grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-end">
      <FormSelect
        v-model="selectedCountry"
        :label="t('country')"
        :options="countryOptions"
      />
      <dl
        class="flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50/80 px-4 py-3 dark:border-stone-700 dark:bg-stone-900/50 sm:min-w-40 sm:justify-center"
      >
        <span
          class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
          aria-hidden="true"
        >
          <Icon
            name="ph:map-pin-duotone"
            class="size-5"
          />
        </span>
        <div>
          <dt class="text-xs font-medium text-stone-500 dark:text-stone-400">
            {{ t('cityCountLabel') }}
          </dt>
          <dd class="font-display text-2xl font-semibold tabular-nums leading-tight text-stone-900 dark:text-stone-50">
            {{ pending ? '…' : cityCount }}
          </dd>
        </div>
      </dl>
    </section>

    <form
      class="surface-card space-y-4 p-5"
      @submit.prevent="addCity()"
    >
      <h2 class="text-sm font-semibold text-stone-900 dark:text-stone-100">
        {{ t('addTitle') }}
      </h2>

      <FormLocaleTabs
        v-model="contentLocale"
        ru-required
      >
        <template #ru>
          <FormInput
            v-model="form.name"
            :label="t('formName')"
            required
          />
        </template>
        <template #en>
          <FormInput
            v-model="form.nameEn"
            :label="t('formName')"
          />
        </template>
      </FormLocaleTabs>

      <div class="flex justify-end border-t border-stone-200 pt-4 dark:border-stone-800">
        <UiButton
          type="submit"
          :loading="saving"
        >
          {{ t('add') }}
        </UiButton>
      </div>
    </form>

    <section class="space-y-3">
      <p
        v-if="pending"
        class="text-sm text-stone-500 dark:text-stone-400"
      >
        {{ t('loading') }}
      </p>

      <ul
        v-else
        class="divide-y divide-stone-200 overflow-hidden rounded-xl border border-stone-200 bg-white dark:divide-stone-800 dark:border-stone-800 dark:bg-stone-900"
      >
        <li
          v-for="city in cities ?? []"
          :key="city.id"
          class="flex items-center justify-between gap-3 px-4 py-3"
        >
          <div class="min-w-0">
            <p class="font-medium text-stone-900 dark:text-stone-50">
              {{ city.name }}
            </p>
            <p
              v-if="city.nameEn"
              class="truncate text-sm text-stone-500 dark:text-stone-400"
            >
              {{ city.nameEn }}
            </p>
          </div>
          <UiButton
            size="sm"
            class="shrink-0"
            :variant="city.active ? 'secondary' : 'outline'"
            @click="toggleActive(city.id, city.active)"
          >
            {{ city.active ? t('active') : t('inactive') }}
          </UiButton>
        </li>
        <li
          v-if="!cityCount"
          class="px-4 py-8 text-center text-sm text-stone-500 dark:text-stone-400"
        >
          {{ t('empty') }}
        </li>
      </ul>
    </section>
  </div>
</template>
