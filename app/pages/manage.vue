<template>
  <div
    class="min-h-screen bg-(--ui-bg) text-(--ui-text) font-sans selection:bg-primary-500/30"
  >
    <!-- Premium Navigation Shell -->
    <div class="flex flex-col md:flex-row min-h-screen">
      <!-- Sidebar / Navigation (Desktop) -->
      <aside
        class="hidden md:flex flex-col w-72 border-r border-default sticky top-0 h-screen bg-default/50 backdrop-blur-xl"
      >
        <div class="p-8 pb-12">
          <NuxtLink to="/" class="flex items-center space-x-4 group">
            <div
              class="w-10 h-10 bg-primary-500 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)] group-hover:shadow-[0_0_25px_rgba(16,185,129,0.6)] transition-all duration-300"
            >
              <UIcon
                name="i-heroicons-command-line"
                class="w-6 h-6 text-white"
              />
            </div>
            <div>
              <h1
                class="text-xl font-bold tracking-tight group-hover:text-primary-400 transition-colors uppercase leading-tight"
              >
                {{ $t("manage.title") }}
              </h1>
              <p
                class="text-[10px] uppercase tracking-[0.2em] text-primary-400 font-black"
              >
                {{ $t("manage.subtitle") }}
              </p>
            </div>
          </NuxtLink>
        </div>

        <nav class="flex-1 px-4 space-y-2">
          <UNavigationMenu
            orientation="vertical"
            :items="navItems"
            class="w-full"
          />
        </nav>

        <div class="p-8 border-t border-default">
          <UButton
            icon="i-heroicons-arrow-left"
            variant="ghost"
            color="neutral"
            to="/"
            block
            class="hover:bg-primary-500/5 hover:text-primary-500 font-bold"
          >
            {{ $t("dashboard.exit") }}
          </UButton>
        </div>
      </aside>

      <!-- Mobile Header -->
      <header
        class="md:hidden sticky top-0 z-50 backdrop-blur-xl bg-default/50 border-b border-default p-4 flex items-center justify-between"
      >
        <div class="flex items-center space-x-3">
          <div
            class="w-8 h-8 bg-primary-500 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)]"
          >
            <UIcon name="i-heroicons-command-line" class="w-5 h-5 text-white" />
          </div>
          <span
            class="font-black text-xs uppercase tracking-widest text-primary-400"
            >{{ $t("manage.controlCenter") }}</span
          >
        </div>

        <div class="flex items-center space-x-2">
          <ThemeToggle />
          <UPopover>
            <UButton
              icon="i-heroicons-bars-3"
              variant="ghost"
              color="neutral"
            />
            <template #content>
              <div class="p-4 w-64 space-y-4">
                <UNavigationMenu
                  orientation="vertical"
                  :items="navItems"
                  class="w-full"
                />
                <UButton
                  icon="i-heroicons-arrow-left"
                  variant="outline"
                  color="neutral"
                  to="/"
                  block
                >
                  {{ $t("dashboard.exit") }}
                </UButton>
              </div>
            </template>
          </UPopover>
        </div>
      </header>

      <!-- Content Area -->
      <main class="flex-1 overflow-y-auto">
        <!-- Modern Toolbar -->
        <div
          class="sticky top-0 z-40 bg-default/80 backdrop-blur-sm border-b border-default hidden md:flex items-center justify-between px-8 h-16 sm:h-20"
        >
          <UBreadcrumb :items="breadcrumbItems" />
          <div class="flex items-center space-x-4">
            <ThemeToggle />
          </div>
        </div>

        <UContainer class="py-8 sm:py-16 md:px-12 max-w-7xl mx-auto pb-32">
          <NuxtPage />
        </UContainer>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useConfigStore } from "~~/stores/config";

const { t } = useI18n();
const store = useConfigStore();
const route = useRoute();

const navItems = computed(() => [
  {
    label: t("manage.controlCenter"),
    icon: "i-heroicons-home",
    to: "/manage",
    exact: true,
  },
  {
    label: t("manage.tabs.backgrounds"),
    icon: "i-heroicons-photo",
    to: "/manage/backgrounds",
  },
  {
    label: t("manage.tabs.preferences"),
    icon: "i-heroicons-adjustments-horizontal",
    to: "/manage/preferences",
  },
  {
    label: t("manage.tabs.modules"),
    icon: "i-heroicons-squares-2x2",
    to: "/manage/modules",
  },
  {
    label: t("manage.tabs.raw"),
    icon: "i-heroicons-code-bracket",
    to: "/manage/raw",
  },
]);

const breadcrumbItems = computed(() => {
  const items = [
    { label: t("manage.title"), to: "/manage", icon: "i-heroicons-home" },
  ];

  const current = navItems.value.find(
    (item) => item.to === route.path && item.to !== "/manage",
  );
  if (current) {
    items.push({ label: current.label, to: current.to, icon: current.icon });
  }

  return items;
});

onMounted(() => {
  if (!store.config) {
    store.fetchConfig();
  }
});

definePageMeta({
  layout: false,
});
</script>
