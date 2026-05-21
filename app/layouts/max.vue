<script setup lang="ts">
const { loadSdk, applyThemeFromBridge } = useMaxBridge()

useHead({
  script: [
    {
      src: 'https://st.max.ru/js/max-web-app.js',
      defer: true,
    },
  ],
})

onMounted(() => {
  loadSdk()
    .then(() => applyThemeFromBridge())
    .catch(() => undefined)
})
</script>

<template>
  <div
    class="flex min-h-screen flex-col bg-(--max-bg-color,var(--color-stone-50)) text-(--max-text-color,var(--color-stone-900)) dark:bg-(--max-bg-color,var(--color-stone-950)) dark:text-(--max-text-color,var(--color-stone-100))"
  >
    <header
      class="border-b border-stone-200 px-4 py-3 dark:border-stone-800"
      :style="{
        backgroundColor: 'var(--max-header-bg-color, transparent)',
      }"
    >
      <p class="text-sm font-semibold tracking-wide text-teal-700 dark:text-teal-400">
        Golewood
      </p>
    </header>
    <main class="flex-1 px-4 py-5">
      <slot />
    </main>
  </div>
</template>
