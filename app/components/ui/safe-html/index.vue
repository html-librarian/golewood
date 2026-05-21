<script setup lang="ts">
defineProps<{
  html: string
}>()
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -- sanitized HTML only -->
  <div v-html="html" />
</template>
