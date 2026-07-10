<template>
  <BaseModule>
    <div
      v-if="weather"
      class="flex flex-col items-center justify-center text-white"
    >
      <!-- Current Weather -->
      <div class="flex flex-col items-center space-y-2">
        <div class="flex items-center space-x-4">
          <UIcon
            :name="
              getWeatherIcon(weather.current.weatherCode, weather.current.isDay)
            "
            class="w-16 h-16 md:w-24 md:h-24 text-white"
          />
          <div class="text-5xl md:text-7xl font-bold tabular-nums">
            {{ weather.current.temp }}°
          </div>
        </div>

        <!-- Details below temp -->
        <div class="flex flex-col items-center text-center">
          <div
            v-if="showLocation"
            class="text-sm md:text-lg font-bold opacity-90 uppercase tracking-widest"
          >
            {{ weather.location }}
          </div>
          <div
            class="flex items-center space-x-4 opacity-60 text-xs md:text-sm font-bold mt-1"
          >
            <div v-if="showWindSpeed" class="flex items-center">
              <UIcon name="i-heroicons-wind-power" class="mr-1.5 w-4 h-4" />
              {{ Math.round(weather.current.windSpeed) }} km/h
            </div>
            <div v-if="showHumidity" class="flex items-center">
              <UIcon name="i-heroicons-beaker" class="mr-1.5 w-4 h-4" />
              {{ weather.current.humidity }}%
            </div>
          </div>
        </div>
      </div>

      <!-- Sunrise/Sunset -->
      <div
        v-if="showSunriseSunset"
        class="flex items-center space-x-6 mt-4 opacity-40 text-[10px] md:text-xs uppercase tracking-[0.2em] font-black"
      >
        <div class="flex items-center">
          <UIcon name="i-heroicons-sun" class="mr-2 w-4 h-4" />
          {{ formatTime(weather.current.sunrise) }}
        </div>
        <div class="flex items-center">
          <UIcon name="i-heroicons-moon" class="mr-2 w-4 h-4" />
          {{ formatTime(weather.current.sunset) }}
        </div>
      </div>

      <!-- Forecast -->
      <div
        v-if="showForecast && weather.daily"
        class="mt-8 flex flex-col w-full max-w-[280px] mx-auto pt-6 border-t border-white/10 space-y-2"
      >
        <div
          v-for="day in weather.daily"
          :key="day.date"
          class="flex items-center justify-between"
        >
          <div
            class="w-12 text-[10px] uppercase font-black opacity-40 tracking-widest"
          >
            {{ formatDay(day.date) }}
          </div>
          <div class="flex-1 flex justify-center">
            <UIcon
              :name="getWeatherIcon(day.weatherCode, true)"
              class="w-6 h-6 text-white"
            />
          </div>
          <div
            class="w-16 flex items-center justify-end space-x-3 text-xs font-bold"
          >
            <span class="text-white w-7 text-right">{{ day.tempMax }}°</span>
            <span class="text-white/30 w-7 text-right">{{ day.tempMin }}°</span>
          </div>
        </div>
      </div>

      <div
        v-if="showProvider"
        class="mt-6 text-[8px] md:text-[10px] opacity-20 uppercase tracking-[0.3em] font-black"
      >
        Powered by Open-Meteo
      </div>
    </div>

    <div
      v-if="isLoading && !weather"
      class="flex items-center space-x-3 text-white/40"
    >
      <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin" />
      <span class="text-xs font-black uppercase tracking-[0.2em]">{{
        $t("modules.weather.fetching")
      }}</span>
    </div>

    <div
      v-else-if="hasError && !weather"
      class="flex flex-col items-center justify-center p-2 text-center text-white/60 cursor-pointer hover:text-white transition-colors duration-200"
      @click="handleRetry"
    >
      <UIcon name="i-heroicons-exclamation-triangle" class="w-8 h-8 text-amber-500/80 mb-2" />
      <span class="text-[10px] font-black uppercase tracking-[0.2em] max-w-[180px] leading-tight">
        {{ $t("modules.weather.error") }}
      </span>
      <span class="text-[8px] font-bold uppercase tracking-[0.1em] opacity-50 mt-1.5 border border-white/20 px-2 py-0.5 rounded-full hover:bg-white/10">
        {{ $t("modules.weather.retry") }}
      </span>
    </div>
  </BaseModule>
</template>

<script setup lang="ts">
import { BaseModule } from "../BaseModule/types";
import type { WeatherModuleConfig } from "./index";
import { getWeatherIcon } from "./weatherUtils";

const props = defineProps<WeatherModuleConfig>();

const weather = ref<any>(null);
const isLoading = ref(true);
const hasError = ref(false);
const retryCount = ref(0);
let retryTimer: any = null;

const fetchWeather = async () => {
  try {
    isLoading.value = true;
    hasError.value = false;
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
    const data = await $fetch<any>("/api/weather", {
      params: {
        lat: props.lat,
        lon: props.lon,
      },
    });
    weather.value = data;
    retryCount.value = 0; // Reset on success
  } catch (error) {
    console.error("Failed to fetch weather:", error);
    // Only show error UI if we don't already have weather data loaded
    if (!weather.value) {
      hasError.value = true;
    }

    // Auto-retry with backoff if we don't have weather data
    if (!weather.value && retryCount.value < 6) {
      retryCount.value++;
      const delay = Math.min(10000 * Math.pow(2, retryCount.value), 300000); // 20s, 40s, 80s, 160s, 300s, 300s
      console.log(`WeatherModule: scheduling auto-retry #${retryCount.value} in ${delay}ms`);
      retryTimer = setTimeout(fetchWeather, delay);
    }
  } finally {
    isLoading.value = false;
  }
};

const handleRetry = () => {
  retryCount.value = 0;
  fetchWeather();
};

const formatTime = (isoString: string) => {
  if (!isoString) return "";
  return new Date(isoString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const formatDay = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { weekday: "short" });
};

let timer: any = null;

onMounted(() => {
  fetchWeather();
  timer = setInterval(fetchWeather, 30 * 60 * 1000); // Update every 30 mins
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
  if (retryTimer) clearTimeout(retryTimer);
});

watch(() => [props.lat, props.lon], fetchWeather);
</script>
