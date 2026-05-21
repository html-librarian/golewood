<script setup lang="ts">
import { buildShareLink, copyShareUrl, type ShareChannel } from '#shared/utils/share'
import type { ListingShareProps } from './types'

const props = defineProps<ListingShareProps>()

const open = ref(false)
const copied = ref(false)
const rootRef = ref<HTMLElement | null>(null)
let copiedTimeout: ReturnType<typeof setTimeout> | undefined

type ShareMenuItem =
  | { id: 'copy', icon: string, labelKey: 'share.copyLink' }
  | { id: ShareChannel, icon: string, labelKey: string, external: true }

const menuItems: ShareMenuItem[] = [
  { id: 'copy', icon: 'ph:link', labelKey: 'share.copyLink' },
  { id: 'vk', icon: 'simple-icons:vk', labelKey: 'share.vk', external: true },
  { id: 'ok', icon: 'simple-icons:odnoklassniki', labelKey: 'share.ok', external: true },
  { id: 'pinterest', icon: 'simple-icons:pinterest', labelKey: 'share.pinterest', external: true },
  { id: 'telegram', icon: 'simple-icons:telegram', labelKey: 'share.telegram', external: true },
]

const sharePayload = computed(() => ({
  url: props.url,
  title: props.title,
  imageUrl: props.imageUrl ?? null,
}))

const closeMenu = () => {
  open.value = false
}

const toggleMenu = () => {
  open.value = !open.value
}

const onCopyLink = async () => {
  try {
    await copyShareUrl(props.url)
    copied.value = true
    clearTimeout(copiedTimeout)
    copiedTimeout = setTimeout(() => {
      copied.value = false
    }, 2500)
  } catch {
    copied.value = false
  }
}

const onMenuItemClick = async (item: ShareMenuItem) => {
  if (item.id === 'copy') {
    await onCopyLink()
    return
  }

  const link = buildShareLink(item.id, sharePayload.value)
  window.open(link, '_blank', 'noopener,noreferrer,width=600,height=520')
  closeMenu()
}

const onDocumentClick = (event: MouseEvent) => {
  if (!open.value || !rootRef.value) {
    return
  }

  if (!rootRef.value.contains(event.target as Node)) {
    closeMenu()
  }
}

const onDocumentKeydown = (event: KeyboardEvent) => {
  if (open.value && event.key === 'Escape') {
    closeMenu()
  }
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  document.addEventListener('keydown', onDocumentKeydown)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onDocumentKeydown)
  clearTimeout(copiedTimeout)
})
</script>

<template>
  <div
    ref="rootRef"
    class="relative"
    data-testid="listing-share"
  >
    <UiButton
      variant="outline"
      size="sm"
      type="button"
      :aria-expanded="open"
      aria-haspopup="menu"
      data-testid="listing-share-toggle"
      @click.stop="toggleMenu()"
    >
      <Icon
        name="ph:share-network-duotone"
        class="mr-1.5 size-4"
      />
      {{ $t('share.title') }}
    </UiButton>

    <p
      v-if="copied"
      role="status"
      class="absolute right-0 top-full z-20 mt-1 rounded-lg bg-stone-900 px-2.5 py-1 text-xs font-medium text-white dark:bg-stone-100 dark:text-stone-900"
    >
      {{ $t('share.copied') }}
    </p>

    <div
      v-if="open"
      role="menu"
      data-testid="listing-share-menu"
      class="absolute right-0 z-30 mt-2 min-w-60 overflow-hidden rounded-2xl border border-stone-200 bg-white py-1.5 shadow-lg dark:border-stone-700 dark:bg-stone-900"
      @click.stop
    >
      <button
        v-for="item in menuItems"
        :key="item.id"
        type="button"
        role="menuitem"
        class="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-stone-800 transition hover:bg-stone-50 dark:text-stone-100 dark:hover:bg-stone-800"
        :data-testid="`listing-share-${item.id}`"
        @click="onMenuItemClick(item)"
      >
        <Icon
          :name="item.icon"
          class="size-5 shrink-0"
          :class="{
            'text-stone-800 dark:text-stone-200': item.id === 'copy',
            'text-[#0077FF]': item.id === 'vk',
            'text-[#EE8208]': item.id === 'ok',
            'text-[#E60023]': item.id === 'pinterest',
            'text-[#26A5E4]': item.id === 'telegram',
          }"
        />
        <span>
          {{ item.id === 'copy' && copied ? $t('share.copied') : $t(item.labelKey) }}
        </span>
      </button>
    </div>
  </div>
</template>
