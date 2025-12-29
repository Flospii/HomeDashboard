<template>
  <BaseModule>
    <div
      v-if="isLoading"
      class="flex items-center justify-center min-w-[140px] md:min-w-[220px] min-h-[100px] md:min-h-[150px]"
    >
      <UIcon
        name="i-heroicons-arrow-path"
        class="w-6 h-6 md:w-8 md:h-8 text-white animate-spin opacity-50"
      />
    </div>
    <div v-else class="flex flex-col text-white min-w-[140px] md:min-w-[220px]">
      <div
        v-if="showLocation"
        class="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] opacity-40 mb-1"
      >
        {{ weatherData?.location }}
      </div>
      <div class="flex items-center justify-between mb-3 md:mb-6">
        <div>
          <div
            class="text-4xl md:text-6xl font-black tracking-tighter text-white [text-shadow:0_0_20px_rgba(255,255,255,0.3)]"
          >
            {{ weatherData?.current.temp }}°
          </div>
          <div
            class="text-[10px] md:text-sm opacity-50 mt-0.5 md:mt-1 uppercase tracking-wider font-medium"
          >
            {{ weatherDescription }}
          </div>
        </div>
        <div class="[text-shadow:0_0_20px_rgba(16,185,129,0.5)]">
          <UIcon
            :name="getWeatherIcon(weatherData?.current.weatherCode || 0)"
            class="w-10 h-10 md:w-14 md:h-14 text-white"
          />
        </div>
      </div>

      <!-- Enhanced Stats -->
      <div
        v-if="showWindSpeed || showHumidity || showSunriseSunset"
        class="grid grid-cols-2 gap-2 mb-4 text-[10px] md:text-xs opacity-80"
      >
        <div v-if="showWindSpeed" class="flex items-center space-x-1.5">
          <UIcon name="i-heroicons-variable" class="w-3.5 h-3.5 opacity-50" />
          <span>{{ weatherData?.current.windSpeed }} km/h</span>
        </div>
        <div v-if="showHumidity" class="flex items-center space-x-1.5">
          <UIcon name="i-heroicons-beaker" class="w-3.5 h-3.5 opacity-50" />
          <span>{{ weatherData?.current.humidity }}%</span>
        </div>
        <div v-if="showSunriseSunset" class="flex items-center space-x-1.5">
          <UIcon name="i-heroicons-sun" class="w-3.5 h-3.5 opacity-50" />
          <span>{{ formatTime(weatherData?.current.sunrise) }}</span>
        </div>
        <div v-if="showSunriseSunset" class="flex items-center space-x-1.5">
          <UIcon name="i-heroicons-moon" class="w-3.5 h-3.5 opacity-50" />
          <span>{{ formatTime(weatherData?.current.sunset) }}</span>
        </div>
      </div>

      <div class="space-y-2 md:space-y-3 border-t border-white/10 pt-3 md:pt-6">
        <div
          v-for="day in weatherData?.daily"
          :key="day.date"
          class="flex items-center justify-between text-[11px] md:text-sm font-medium"
        >
          <span class="w-10 md:w-12 opacity-60 uppercase tracking-tight">{{
            formatWeekday(day.date)
          }}</span>
          <UIcon
            :name="getWeatherIcon(day.weatherCode)"
            class="w-4 h-4 md:w-6 md:h-6 opacity-80"
          />
          <div class="w-12 text-right flex justify-end space-x-1.5">
            <span class="font-bold">{{ day.tempMax }}°</span>
            <span class="opacity-30">{{ day.tempMin }}°</span>
          </div>
        </div>
      </div>

      <div
        v-if="showProvider"
        class="mt-2 md:mt-4 pt-2 md:pt-4 border-t border-white/5 flex justify-end"
      >
        <div
          class="text-[8px] md:text-[10px] opacity-30 uppercase tracking-widest font-bold"
        >
          Source: {{ weatherProvider }}
        </div>
      </div>
    </div>
  </BaseModule>
</template>

<script setup lang="ts">
import BaseModule from "./BaseModule.vue";

import type { WeatherModuleConfig } from "../../types/config";

const props = defineProps<
  WeatherModuleConfig & {
    showWindSpeed?: boolean;
    showHumidity?: boolean;
    showSunriseSunset?: boolean;
    showLocation?: boolean;
  }
>();

const weatherData = ref<any>(null);
const isLoading = ref(true);

const weatherDescription = computed(() => {
  const code = weatherData.value?.current.weatherCode;
  if (code === 0) return "Clear sky";
  if (code <= 3) return "Partly cloudy";
  if (code <= 48) return "Foggy";
  if (code <= 67) return "Rainy";
  if (code <= 77) return "Snowy";
  if (code <= 82) return "Showers";
  if (code <= 99) return "Thunderstorm";
  return "Cloudy";
});

const getWeatherIcon = (code: number) => {
  if (code === 0) return "i-heroicons-sun-solid";
  if (code <= 3) return "i-heroicons-cloud-solid";
  if (code <= 48) return "i-heroicons-cloud-solid";
  if (code <= 67) return "i-heroicons-cloud-rain-solid";
  if (code <= 77) return "i-heroicons-cloud-solid";
  if (code <= 82) return "i-heroicons-cloud-rain-solid";
  if (code <= 99) return "i-heroicons-bolt-solid";
  return "i-heroicons-cloud-solid";
};

const formatTime = (isoString: string) => {
  if (!isoString) return "";
  return new Date(isoString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatWeekday = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString([], { weekday: "short" });
};

const fetchWeather = async () => {
  if (!props.lat || !props.lon) return;

  try {
    const response = await fetch(
      `/api/weather?lat=${props.lat}&lon=${props.lon}`
    );
    weatherData.value = await response.json();
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
