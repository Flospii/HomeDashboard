<template>
  <BaseModule>
    <div class="flex flex-col text-white min-w-[200px]">
      <div class="flex items-center justify-between mb-4">
        <div>
          <div class="text-4xl font-bold">{{ currentTemp }}°</div>
          <div class="text-sm opacity-80">Feels like {{ feelsLike }}°</div>
        </div>
        <div class="text-5xl">
          <!-- Placeholder for SVG Icon -->
          <UIcon name="i-heroicons-cloud-solid" class="w-12 h-12" />
        </div>
      </div>

      <div class="space-y-2 border-t border-white/10 pt-4">
        <div
          v-for="day in forecast"
          :key="day.date"
          class="flex items-center justify-between text-sm"
        >
          <span class="w-12">{{ day.weekday }}</span>
          <UIcon :name="day.icon" class="w-5 h-5 opacity-80" />
          <span class="w-12 text-right font-medium">{{ day.temp }}°</span>
        </div>
      </div>
    </div>
  </BaseModule>
</template>

<script setup lang="ts">
import BaseModule from "./BaseModule.vue";

// Mock data for initial implementation
const currentTemp = ref(18);
const feelsLike = ref(16);

const forecast = ref([
  {
    date: "2025-12-27",
    weekday: "Mon",
    icon: "i-heroicons-sun-solid",
    temp: 22,
  },
  {
    date: "2025-12-28",
    weekday: "Tue",
    icon: "i-heroicons-cloud-solid",
    temp: 19,
  },
  {
    date: "2025-12-29",
    weekday: "Wed",
    icon: "i-heroicons-cloud-rain-solid",
    temp: 15,
  },
  {
    date: "2025-12-30",
    weekday: "Thu",
    icon: "i-heroicons-sun-solid",
    temp: 21,
  },
  {
    date: "2025-12-31",
    weekday: "Fri",
    icon: "i-heroicons-cloud-solid",
    temp: 18,
  },
]);
</script>
