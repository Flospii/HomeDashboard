<template>
  <div class="relative w-full h-full overflow-hidden">
    <div v-if="store.isLoading" class="flex items-center justify-center h-full text-default text-2xl">
      Loading Dashboard...
    </div>
    <div v-else-if="store.error" class="flex items-center justify-center h-full text-error-500 text-2xl">
      Error: {{ store.error }}
    </div>
    <template v-else-if="store.config">
      <!-- Background Layer -->
      <BackgroundCanvas :media="store.allBackgrounds" :interval="store.config.background.interval"
        :transition-mode="store.config.background.transitionMode"
        :playback-order="store.config.background.playbackOrder" />

      <!-- UI Overlay Grid -->
      <DashboardGrid>
        <template v-for="pos in positions" :key="pos" #[pos]>
          <div v-for="mod in store.getModulesAtPosition(pos)" :key="mod.id">
            <component :is="moduleMap[mod.module]" v-bind="mod.config" />
          </div>
        </template>
      </DashboardGrid>
    </template>
  </div>
</template>

<script setup lang="ts">
import BackgroundCanvas from "~/components/BackgroundCanvas.vue";
import DashboardGrid from "~/components/DashboardGrid.vue";
import ClockModule from "~/components/modules/ClockModule.vue";
import WeatherModule from "~/components/modules/WeatherModule.vue";
import NewsFeedModule from "~/components/modules/NewsFeedModule.vue";
import BackgroundMetadataModule from "~/components/modules/BackgroundMetadataModule.vue";
import QRCodeModule from "~/components/modules/QRCodeModule.vue";
import { useConfigStore } from "~~/stores/config";

const store = useConfigStore();

onMounted(() => {
  store.fetchConfig();
  store.startConfigPolling();
});

onUnmounted(() => {
  store.stopConfigPolling();
});

const moduleMap: Record<string, any> = {
  clock: ClockModule,
  weather: WeatherModule,
  news: NewsFeedModule,
  "background-metadata": BackgroundMetadataModule,
  qrcode: QRCodeModule,
};

const positions = [
  "top_left",
  "top_center",
  "top_right",
  "middle_left",
  "middle_center",
  "middle_right",
  "bottom_left",
  "bottom_center",
  "bottom_right",
] as const;
</script>
