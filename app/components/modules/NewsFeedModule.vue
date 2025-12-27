<template>
  <BaseModule class="overflow-hidden">
    <div class="flex items-center">
      <UBadge
        label="News"
        color="primary"
        variant="solid"
        class="mr-4 font-bold uppercase tracking-wider"
      />
      <div class="flex-grow overflow-hidden whitespace-nowrap">
        <div class="ticker-content inline-block animate-ticker">
          <span
            v-for="(item, index) in news"
            :key="index"
            class="mx-8 font-medium [text-shadow:0_0_20px_rgba(255,255,255,0.3)]"
          >
            {{ item }}
          </span>
        </div>
      </div>
    </div>
  </BaseModule>
</template>

<script setup lang="ts">
import BaseModule from "./BaseModule.vue";

const news = ref([
  "SpaceX successfully launches another Starlink mission.",
  "Global markets show steady growth in Q4.",
  "New breakthrough in renewable energy storage announced.",
  "Local community garden wins national sustainability award.",
  "Tech giants announce new collaboration on AI ethics.",
]);
</script>

<style scoped>
.animate-ticker {
  display: inline-block;
  padding-left: 100%;
  animation: ticker 40s linear infinite;
}

@keyframes ticker {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-100%);
  }
}

.ticker-content:hover {
  animation-play-state: paused;
}
</style>
