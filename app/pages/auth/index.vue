<script setup lang="ts">
const localePath = useLocalePath()

await navigateTo(localePath('/auth/login'), { replace: true })
</script>

<template>
  <div />
</template>
