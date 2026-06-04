<script setup lang="ts">
import type { UiPageHeaderProps } from './types'

withDefaults(defineProps<UiPageHeaderProps>(), {
  accent: true,
})
</script>

<template>
  <header class="page-header-block">
    <p
      v-if="kicker"
      class="editorial-kicker editorial-kicker-leaf"
    >
      {{ kicker }}
    </p>
    <h1
      class="section-title"
      :class="accent ? 'section-title-accent' : ''"
    >
      {{ title }}
    </h1>
    <p
      v-if="subtitle || $slots.subtitle"
      class="section-subtitle"
    >
      <slot name="subtitle">
        {{ subtitle }}
      </slot>
    </p>
    <div
      v-if="$slots.default"
      class="pt-2"
    >
      <slot />
    </div>
  </header>
</template>
