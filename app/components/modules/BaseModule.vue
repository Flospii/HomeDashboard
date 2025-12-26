<template>
  <div
    class="glass-module p-6 rounded-2xl shadow-2xl backdrop-blur-md bg-white/10 border border-white/20 transition-all duration-500"
    :class="[dimmed ? 'opacity-40 scale-95' : 'opacity-100 scale-100']"
  >
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  dimmed?: boolean;
}>();
</script>

<style scoped>
.glass-module {
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
}
</style>
