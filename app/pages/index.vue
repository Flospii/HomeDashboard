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
      <BackgroundCanvas :transition-mode="store.config.background.transitionMode" />

      <!-- UI Overlay Grid -->
      <DashboardGrid>
        <template v-for="pos in positions" :key="pos" #[pos]>
          <div v-for="mod in store.getModulesAtPosition(pos)" :key="mod.id">
            <NuxtErrorBoundary>
              <component :is="getModuleComponent(mod.module)" v-bind="mod.config" />
              <template #error="{ error, clearError }">
                <div class="flex flex-col items-center justify-center p-4 bg-black/40 backdrop-blur-md rounded-xl border border-red-500/30 text-white/80 cursor-pointer hover:bg-black/60 transition-colors" @click="clearError">
                  <UIcon name="i-heroicons-exclamation-triangle" class="w-8 h-8 text-red-400 mb-2" />
                  <span class="text-[10px] font-black uppercase tracking-widest text-center">{{ mod.module }} Error</span>
                  <span class="text-[8px] opacity-50 mt-1 uppercase tracking-widest">Click to retry</span>
                </div>
              </template>
            </NuxtErrorBoundary>
          </div>
        </template>
      </DashboardGrid>
    </template>
  </div>
</template>

<script setup lang="ts">
import BackgroundCanvas from "~/components/BackgroundCanvas.vue";
import DashboardGrid from "~/components/DashboardGrid.vue";
import { useConfigStore } from "~/stores/config";
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
