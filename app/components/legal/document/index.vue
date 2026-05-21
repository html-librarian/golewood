<script setup lang="ts">
import type { LegalDocumentProps } from './types'

defineProps<LegalDocumentProps>()
</script>

<template>
  <article class="space-y-6">
    <header class="space-y-2">
      <h1 class="section-title">
        {{ title }}
      </h1>
      <p class="text-sm text-stone-500 dark:text-stone-400">
        {{ updated }}
      </p>
      <p
        v-if="intro"
        class="max-w-2xl text-stone-600 dark:text-stone-400"
      >
        {{ intro }}
      </p>
    </header>

    <section
      v-for="(section, index) in sections"
      :key="index"
      class="surface-card space-y-2 p-5"
    >
      <h2 class="font-display text-lg font-semibold text-stone-900 dark:text-stone-50">
        {{ section.title }}
      </h2>
      <p
        v-for="(paragraph, pIndex) in section.paragraphs"
        :key="pIndex"
        class="text-sm leading-relaxed text-stone-600 dark:text-stone-400"
      >
        {{ paragraph }}
      </p>
    </section>
  </article>
</template>
