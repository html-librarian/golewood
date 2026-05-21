<script setup lang="ts">
import type { ListingImageProps } from './types'

const props = withDefaults(defineProps<ListingImageProps>(), {
  eager: false,
})

const loaded = ref(false)
const failed = ref(false)
const imgRef = ref<HTMLImageElement | null>(null)

watch(() => props.src, () => {
  loaded.value = false
  failed.value = false
  nextTick(() => {
    if (imgRef.value?.complete && imgRef.value.naturalWidth > 0) {
      loaded.value = true
    }
  })
})

const onLoad = () => {
  loaded.value = true
  failed.value = false
}

const onError = () => {
  loaded.value = false
  failed.value = true
}
</script>

<template>
  <div class="relative size-full overflow-hidden bg-stone-100 dark:bg-stone-800">
    <ListingImagePlaceholder v-if="failed" />

    <template v-else>
      <div
        v-if="!loaded"
        class="absolute inset-0 skeleton-shimmer"
        aria-hidden="true"
      />

      <img
        ref="imgRef"
        :src="src"
        :alt="alt"
        :loading="eager ? 'eager' : 'lazy'"
        :fetchpriority="eager ? 'high' : 'auto'"
        decoding="async"
        class="size-full object-cover transition-opacity duration-500"
        :class="[loaded ? 'opacity-100' : 'opacity-0', props.class]"
        @load="onLoad"
        @error="onError"
      >
    </template>
  </div>
</template>
