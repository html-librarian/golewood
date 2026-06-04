<script setup lang="ts">
import type { ListingSectionNavEmits, ListingSectionNavProps } from './types'

const props = defineProps<ListingSectionNavProps>()
const emit = defineEmits<ListingSectionNavEmits>()

const navRef = ref<HTMLElement | null>(null)
const buttonEls = ref(new Map<string, HTMLElement>())

const indicator = reactive({
  left: 0,
  width: 0,
})

const setButtonRef = (id: string, el: Element | ComponentPublicInstance | null) => {
  const node = el instanceof HTMLElement ? el : null

  if (node) {
    buttonEls.value.set(id, node)
    return
  }

  buttonEls.value.delete(id)
}

const updateIndicator = () => {
  nextTick(() => {
    const nav = navRef.value
    const activeBtn = buttonEls.value.get(props.activeId)

    if (!nav || !activeBtn) {
      indicator.left = 0
      indicator.width = 0
      return
    }

    const navRect = nav.getBoundingClientRect()
    const btnRect = activeBtn.getBoundingClientRect()

    indicator.left = btnRect.left - navRect.left + nav.scrollLeft
    indicator.width = btnRect.width
  })
}

const handleSelect = (id: string) => {
  emit('select', id)
}

watch(() => props.activeId, () => {
  nextTick(updateIndicator)
})

watch(() => props.items, () => {
  nextTick(updateIndicator)
}, { deep: true })

watch(() => props.visible, (isVisible) => {
  if (isVisible) {
    nextTick(updateIndicator)
  }
})

onMounted(() => {
  nextTick(updateIndicator)
  window.addEventListener('resize', updateIndicator, { passive: true })
  navRef.value?.addEventListener('scroll', updateIndicator, { passive: true })
})

onUpdated(() => {
  updateIndicator()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateIndicator)
  navRef.value?.removeEventListener('scroll', updateIndicator)
})
</script>

<template>
  <div
    v-show="visible"
    class="fixed inset-x-0 top-(--site-header-height) z-30 border-b border-stone-200/70 bg-white/90 shadow-sm backdrop-blur-xl dark:border-stone-800/70 dark:bg-stone-950/90"
    data-testid="listing-section-nav"
  >
    <div class="layout-container py-0!">
      <div class="flex items-stretch gap-3 py-0.5">
        <nav
          ref="navRef"
          class="relative flex min-w-0 flex-1 items-center gap-1 overflow-x-auto scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          :aria-label="$t('listingSectionNav.ariaLabel')"
        >
          <span
            v-show="indicator.width > 0"
            class="section-nav-indicator"
            :style="{ left: `${indicator.left}px`, width: `${indicator.width}px` }"
            aria-hidden="true"
          />

          <button
            v-for="item in items"
            :key="item.id"
            :ref="(el) => setButtonRef(item.id, el)"
            type="button"
            class="relative shrink-0 px-3 py-3 text-sm font-medium transition-colors duration-200"
            :class="activeId === item.id
              ? 'text-brand-900 dark:text-brand-100'
              : 'text-stone-600 hover:text-stone-900 dark:text-stone-300 dark:hover:text-stone-100'"
            :aria-current="activeId === item.id ? 'true' : undefined"
            :data-testid="`listing-section-nav-${item.id}`"
            @click="handleSelect(item.id)"
          >
            {{ item.label }}
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
