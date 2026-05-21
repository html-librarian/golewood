<script setup lang="ts">
import type { ListingSectionNavEmits, ListingSectionNavProps } from './types'

defineProps<ListingSectionNavProps>()
const emit = defineEmits<ListingSectionNavEmits>()

const handleSelect = (id: string) => {
  emit('select', id)
}
</script>

<template>
  <div
    v-show="visible"
    class="fixed inset-x-0 top-(--site-header-height) z-30 border-b border-stone-200/90 bg-white/95 backdrop-blur-md dark:border-stone-800/90 dark:bg-stone-950/95"
    data-testid="listing-section-nav"
  >
    <div class="layout-container py-0!">
      <div class="flex items-stretch gap-3 py-0.5">
      <nav
        class="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        :aria-label="$t('listingSectionNav.ariaLabel')"
      >
        <button
          v-for="item in items"
          :key="item.id"
          type="button"
          class="relative shrink-0 px-3 py-3 text-sm font-medium transition"
          :class="activeId === item.id
            ? 'text-stone-900 dark:text-stone-50'
            : 'text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200'"
          :aria-current="activeId === item.id ? 'true' : undefined"
          :data-testid="`listing-section-nav-${item.id}`"
          @click="handleSelect(item.id)"
        >
          {{ item.label }}
          <span
            v-if="activeId === item.id"
            class="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-brand-600 dark:bg-brand-400"
          />
        </button>
      </nav>

      <div
        v-if="$slots.actions"
        class="flex shrink-0 items-center gap-2 border-l border-stone-200 pl-3 dark:border-stone-800"
      >
        <slot name="actions" />
      </div>
      </div>
    </div>
  </div>
</template>
