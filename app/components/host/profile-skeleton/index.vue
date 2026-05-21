<template>
  <div class="page-container space-y-8">
    <div class="surface-card space-y-4 p-6 md:p-8">
      <div class="flex items-start gap-4">
        <UiSkeleton class="size-16 shrink-0 rounded-full" />
        <div class="flex-1 space-y-3">
          <UiSkeleton
            variant="title"
            class="w-1/3"
          />
          <UiSkeleton class="w-1/4" />
          <UiSkeleton class="w-1/2" />
        </div>
      </div>
    </div>

    <div class="space-y-4">
      <UiSkeleton
        variant="title"
        class="w-40"
      />
      <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        <div
          v-for="n in 3"
          :key="n"
          class="surface-card space-y-3 p-4"
        >
          <UiSkeleton variant="card" />
          <UiSkeleton variant="title" />
          <UiSkeleton class="w-2/3" />
        </div>
      </div>
    </div>
  </div>
</template>
