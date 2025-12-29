<template>
  <div
    class="absolute inset-0 z-20 grid grid-cols-3 grid-rows-3 p-4 md:p-8 gap-4 md:gap-8 pointer-events-none"
  >
    <!-- Top Row -->
    <div class="flex flex-col items-start justify-start">
      <slot name="top_left"></slot>
    </div>
    <div class="flex flex-col items-center justify-start">
      <slot name="top_center"></slot>
    </div>
    <div class="flex flex-col items-end justify-start">
      <slot name="top_right"></slot>
    </div>

    <!-- Middle Row -->
    <div class="flex flex-col items-start justify-center">
      <slot name="middle_left"></slot>
    </div>
    <div class="flex flex-col items-center justify-center">
      <slot name="middle_center"></slot>
    </div>
    <div class="flex flex-col items-end justify-center">
      <slot name="middle_right"></slot>
    </div>

    <!-- Bottom Row -->
    <div class="flex flex-col items-start justify-end">
      <slot name="bottom_left"></slot>
    </div>
    <div class="flex flex-col items-center justify-end">
      <slot name="bottom_center"></slot>
    </div>
    <div class="flex flex-col items-end justify-end">
      <slot name="bottom_right"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
// This component provides the grid structure for the dashboard
</script>

<style scoped>
/* Ensure slots don't block interaction if passive, but allow it if needed */
:deep(> *) {
  pointer-events: auto;
}
</style>
