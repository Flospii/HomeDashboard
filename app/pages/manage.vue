<template>
  <div
    class="relative w-full min-h-screen bg-neutral-950 flex flex-col items-center p-8 pb-24 overflow-y-auto"
  >
    <!-- Background Layer (Blurred) -->
    <div class="absolute inset-0 opacity-20 blur-3xl pointer-events-none">
      <div
        class="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/30 rounded-full"
      ></div>
      <div
        class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary-500/30 rounded-full"
      ></div>
    </div>

    <div class="relative z-10 w-full max-w-4xl space-y-8">
      <BackgroundManager />
      <DashboardSettings />
      <ModuleSettings />
    </div>
  </div>
</template>

<script setup lang="ts">
import BackgroundManager from "~/components/BackgroundManager.vue";
import DashboardSettings from "~/components/DashboardSettings.vue";
import ModuleSettings from "~/components/ModuleSettings.vue";
import { useDashboardStore } from "~~/stores/dashboard";

const store = useDashboardStore();

onMounted(() => {
  if (!store.config) {
    store.fetchConfig();
  }
});

definePageMeta({
  layout: false,
});
</script>
