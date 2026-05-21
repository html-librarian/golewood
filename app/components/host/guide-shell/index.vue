<template>
  <div class="page-container py-6 md:py-8">
    <div class="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
      <HostGuideNav class="lg:sticky lg:top-32 lg:self-start" />
      <div class="min-w-0 space-y-6">
        <slot />
      </div>
    </div>
  </div>
</template>
