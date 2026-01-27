<template>
  <div class="relative w-full h-full overflow-hidden">
    <div
      v-if="store.isLoading"
      class="flex items-center justify-center h-full text-default text-2xl"
    >
      Loading Dashboard...
    </div>
    <div
      v-else-if="store.error"
      class="flex items-center justify-center h-full text-error-500 text-2xl"
    >
      Error: {{ store.error }}
    </div>
    <template v-else-if="store.config">
      <!-- Background Layer -->
      <BackgroundCanvas
        :transition-mode="store.config.background.transitionMode"
      />

      <!-- UI Overlay Grid -->
      <DashboardGrid>
        <template v-for="pos in positions" :key="pos" #[pos]>
          <div v-for="mod in store.getModulesAtPosition(pos)" :key="mod.id">
            <component
              :is="getModuleComponent(mod.module)"
              v-bind="mod.config"
            />
          </div>
        </template>
      </DashboardGrid>
    </template>
  </div>
</template>

<script setup lang="ts">
import BackgroundCanvas from "~/components/BackgroundCanvas.vue";
import DashboardGrid from "~/components/DashboardGrid.vue";
import { useConfigStore } from "~~/stores/config";
import { getModuleDefinition } from "~/components/modules/index";

const store = useConfigStore();

onMounted(() => {
  store.fetchConfig();
  store.startConfigPolling();
  store.startStatusPolling();
});

onUnmounted(() => {
  store.stopConfigPolling();
  store.stopStatusPolling();
});

const getModuleComponent = (type: string) => {
  return getModuleDefinition(type)?.component;
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
