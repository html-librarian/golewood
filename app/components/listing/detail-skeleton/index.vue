<template>
  <div class="grid gap-8 lg:grid-cols-[1fr_340px]">
    <div class="space-y-8">
      <UiSkeleton variant="card" class="aspect-16/10" />

      <div class="space-y-4">
        <UiSkeleton variant="title" />
        <UiSkeleton class="w-1/3" />
        <UiSkeleton class="w-1/4" />
      </div>

      <div class="space-y-3">
        <UiSkeleton variant="title" class="w-1/4" />
        <UiSkeleton />
        <UiSkeleton />
        <UiSkeleton class="w-5/6" />
      </div>
    </div>

    <div class="surface-card space-y-4 p-5">
      <UiSkeleton variant="title" class="w-2/3" />
      <UiSkeleton variant="card" class="aspect-square" />
      <UiSkeleton variant="button" class="w-full" />
    </div>
  </div>
</template>
