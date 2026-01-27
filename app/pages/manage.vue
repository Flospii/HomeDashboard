<template>
  <div
    class="min-h-screen bg-(--ui-bg) text-(--ui-text) font-sans selection:bg-primary-500/30"
  >
    <!-- Premium Header -->
    <header
      class="sticky top-0 z-50 sm:backdrop-blur-xl bg-(--ui-bg)/50 border-b border-(--ui-border)"
    >
      <UContainer>
        <div class="flex items-center justify-between h-16 sm:h-20">
          <NuxtLink
            to="/"
            class="flex items-center space-x-3 sm:space-x-4 group"
          >
            <div
              class="w-8 h-8 sm:w-10 sm:h-10 bg-primary-500 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)] group-hover:shadow-[0_0_25px_rgba(16,185,129,0.6)] transition-all duration-300"
            >
              <UIcon
                name="i-heroicons-command-line"
                class="w-5 h-5 sm:w-6 sm:h-6 text-white"
              />
            </div>
            <div class="hidden xs:block">
              <h1
                class="text-lg sm:text-xl font-bold tracking-tight group-hover:text-primary-400 transition-colors"
              >
                {{ $t("manage.title") }}
              </h1>
              <p
                class="text-[8px] sm:text-[10px] uppercase tracking-[0.2em] text-primary-400 font-black"
              >
                {{ $t("manage.subtitle") }}
              </p>
            </div>
          </NuxtLink>
          <div class="flex items-center space-x-2 sm:space-x-4">
            <ThemeToggle />
            <UButton
              icon="i-heroicons-arrow-left"
              variant="ghost"
              color="neutral"
              to="/"
              :label="$t('dashboard.exit')"
              class="hover:bg-(--ui-bg)/5 hidden sm:flex"
            />
            <UButton
              icon="i-heroicons-arrow-left"
              variant="ghost"
              color="neutral"
              to="/"
              class="hover:bg-(--ui-bg)/5 sm:hidden"
            />
          </div>
        </div>
      </UContainer>
    </header>

    <UContainer class="py-6 sm:py-12 pb-32">
      <UTabs
        :items="tabs"
        class="w-full"
        :ui="{
          list: 'bg-(--ui-bg)/5 p-1.5 border border-(--ui-border) mb-8 sm:mb-12 overflow-x-auto flex-nowrap',
          indicator: 'bg-primary-500 shadow-lg shadow-primary-500/20',
          trigger:
            'transition-all duration-300 text-(--ui-text)/40 hover:text-(--ui-text)/70 data-[state=active]:text-(--ui-text) data-[state=active]:font-bold whitespace-nowrap',
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
              <ModuleSettings />
            </div>
          </div>
        </template>

        <template #raw>
          <div class="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <RawConfigEditor />
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
import RawConfigEditor from "~/components/RawConfigEditor.vue";
import { useConfigStore } from "~~/stores/config";

const { t } = useI18n();
const store = useConfigStore();

const tabs = computed(() => [
  {
    slot: "backgrounds",
    label: t("manage.tabs.backgrounds"),
    icon: "i-heroicons-photo",
  },
  {
    slot: "settings",
    label: t("manage.tabs.preferences"),
    icon: "i-heroicons-adjustments-horizontal",
  },
  {
    slot: "modules",
    label: t("manage.tabs.modules"),
    icon: "i-heroicons-squares-2x2",
  },
  {
    slot: "raw",
    label: t("manage.tabs.raw"),
    icon: "i-heroicons-code-bracket",
  },
]);

onMounted(() => {
  if (!store.config) {
    store.fetchConfig();
  }
});

definePageMeta({
  layout: false,
});
</script>
