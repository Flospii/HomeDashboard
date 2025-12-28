<template>
  <BaseModule>
    <div
      v-if="isLoading"
      class="flex items-center justify-center min-w-[220px] min-h-[150px]"
    >
      <UIcon
        name="i-heroicons-arrow-path"
        class="w-8 h-8 text-white animate-spin opacity-50"
      />
    </div>
    <div v-else class="flex flex-col text-white min-w-[220px]">
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

import type { WeatherModuleConfig } from "~/types/config";

const props = defineProps<WeatherModuleConfig>();

const currentTemp = ref(0);
const feelsLike = ref(0);
const forecast = ref<any[]>([]);
const isLoading = ref(true);

const getWeatherIcon = (code: number) => {
  // WMO Weather interpretation codes (WW)
  if (code === 0) return "i-heroicons-sun-solid";
  if (code <= 3) return "i-heroicons-cloud-solid";
  if (code <= 48) return "i-heroicons-cloud-solid"; // Fog
  if (code <= 67) return "i-heroicons-cloud-rain-solid";
  if (code <= 77) return "i-heroicons-cloud-solid"; // Snow
  if (code <= 82) return "i-heroicons-cloud-rain-solid";
  if (code <= 99) return "i-heroicons-bolt-solid";
  return "i-heroicons-cloud-solid";
};

const fetchWeather = async () => {
  if (!props.lat || !props.lon) return;

  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${props.lat}&longitude=${props.lon}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`
    );
    const data = await response.json();

    if (data.current_weather) {
      currentTemp.value = Math.round(data.current_weather.temperature);
      feelsLike.value = currentTemp.value; // Open-Meteo doesn't provide feels_like in basic current_weather

      const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      forecast.value = data.daily.time
        .map((time: string, i: number) => {
          const date = new Date(time);
          return {
            date: time,
            weekday: weekdays[date.getDay()],
            icon: getWeatherIcon(data.daily.weathercode[i]),
            temp: Math.round(data.daily.temperature_2m_max[i]),
          };
        })
        .slice(1, 6); // Next 5 days
    }
  } catch (error) {
    console.error("Failed to fetch weather:", error);
  } finally {
    isLoading.value = false;
  }
};

let timer: any = null;

onMounted(() => {
  fetchWeather();
  // Refresh every 30 minutes
  timer = setInterval(fetchWeather, 30 * 60 * 1000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});

watch(
  () => [props.lat, props.lon],
  () => {
    fetchWeather();
  }
);
</script>
