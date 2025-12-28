<template>
  <BaseModule>
    <div class="flex flex-col text-white min-w-[220px]">
      <div class="flex items-center justify-between mb-6">
        <div>
          <div
            class="text-6xl font-black tracking-tighter text-white [text-shadow:0_0_20px_rgba(255,255,255,0.3)]"
          >
            {{ currentTemp }}°
          </div>
          <div
            class="text-sm opacity-50 mt-1 uppercase tracking-wider font-medium"
          >
            Feels like {{ feelsLike }}°
          </div>
        </div>
        <div class="[text-shadow:0_0_20px_rgba(16,185,129,0.5)]">
          <UIcon name="i-heroicons-cloud-solid" class="w-14 h-14 text-white" />
        </div>
      </div>

      <div class="space-y-3 border-t border-white/10 pt-6">
        <div
          v-for="day in forecast"
          :key="day.date"
          class="flex items-center justify-between text-sm font-medium"
        >
          <span class="w-12 opacity-60 uppercase tracking-tight">{{
            day.weekday
          }}</span>
          <UIcon :name="day.icon" class="w-6 h-6 opacity-80" />
          <span class="w-12 text-right font-bold">{{ day.temp }}°</span>
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
