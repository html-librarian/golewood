<script setup lang="ts">
const i18nHead = useLocaleHead({
  addDirAttribute: true,
})

useHead(() => ({
  htmlAttrs: {
    ...i18nHead.value.htmlAttrs,
  },
}))
</script>

<template>
  <ColorScheme>
    <NuxtLayout>
      <NuxtRouteAnnouncer />
      <NuxtPage />
    </NuxtLayout>
  </ColorScheme>
</template>
