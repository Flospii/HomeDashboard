<template>
  <div
    class="w-full p-4 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden"
  >
    <div class="flex items-center">
      <div
        class="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded mr-4 uppercase tracking-wider"
      >
        News
      </div>
      <div class="flex-grow overflow-hidden whitespace-nowrap">
        <div class="ticker-content inline-block animate-ticker">
          <span
            v-for="(item, index) in news"
            :key="index"
            class="mx-8 text-white/90 font-medium"
          >
            {{ item }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
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
  animation: ticker 30s linear infinite;
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
