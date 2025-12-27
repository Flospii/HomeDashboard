<template>
  <div
    class="min-h-screen bg-(--ui-bg) text-(--ui-text) font-sans selection:bg-primary-500/30"
  >
    <!-- Premium Header -->
    <header
      class="sticky top-0 z-50 backdrop-blur-xl bg-(--ui-bg)/50 border-b border-(--ui-border)"
    >
      <UContainer>
        <div class="flex items-center justify-between h-20">
          <div class="flex items-center space-x-4">
            <div
              class="w-10 h-10 bg-primary-500 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)]"
            >
              <UIcon
                name="i-heroicons-command-line"
                class="w-6 h-6 text-white"
              />
            </div>
            <div>
              <h1 class="text-xl font-bold tracking-tight">Control Center</h1>
              <p
                class="text-[10px] uppercase tracking-[0.2em] text-primary-400 font-black"
              >
                HomeDashboard v2.0
              </p>
            </div>
          </div>

          <UButton
            icon="i-heroicons-arrow-left"
            variant="ghost"
            color="neutral"
            to="/"
            label="Exit to Dashboard"
            class="hover:bg-(--ui-bg)/5"
          />
        </div>
        <ThemeToggle />
      </UContainer>
    </header>

    <UContainer class="py-12 pb-32">
      <UTabs
        :items="tabs"
        class="w-full"
        :ui="{
          list: 'bg-(--ui-bg)/5 p-1.5 border border-(--ui-border) mb-12',
          indicator: 'bg-primary-500 shadow-lg shadow-primary-500/20',
          trigger:
            'transition-all duration-300 text-(--ui-text)/40 hover:text-(--ui-text)/70 data-[state=active]:text-(--ui-text) data-[state=active]:font-bold',
        }"
      >
        <template #backgrounds>
          <div class="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <BackgroundManager />
          </div>
        </template>

        <template #settings>
          <div class="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <DashboardSettings />
          </div>
        </template>

        <template #modules>
          <div class="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div class="max-w-4xl mx-auto">
              <div class="mb-10">
                <h2 class="text-3xl font-bold text-(--ui-text) tracking-tight">
                  Module Configuration
                </h2>
                <p class="text-(--ui-text)/50 mt-1">
                  Enable and position your dashboard widgets
                </p>
              </div>
              <ModuleSettings />
            </div>
          </div>
        </template>
      </UTabs>
    </UContainer>
  </div>
</template>

<script setup lang="ts">
import BackgroundManager from "~/components/BackgroundManager.vue";
import DashboardSettings from "~/components/DashboardSettings.vue";
import ModuleSettings from "~/components/ModuleSettings.vue";

const tabs = [
  {
    slot: "backgrounds",
    label: "Backgrounds",
    icon: "i-heroicons-photo",
  },
  {
    slot: "settings",
    label: "Preferences",
    icon: "i-heroicons-adjustments-horizontal",
  },
  {
    slot: "modules",
    label: "Modules",
    icon: "i-heroicons-squares-2x2",
  },
];
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
