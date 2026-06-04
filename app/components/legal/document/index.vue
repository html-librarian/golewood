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
      <p class="legal-meta">
        {{ updated }}
      </p>
      <p
        v-if="intro"
        class="legal-body max-w-2xl"
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
        class="legal-body"
      >
        {{ paragraph }}
      </p>
    </section>
  </article>
</template>
