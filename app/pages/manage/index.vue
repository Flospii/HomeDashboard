<template>
  <div
    class="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700"
  >
    <!-- Welcome Header -->
    <section
      class="relative overflow-hidden p-8 sm:p-12 border border-default bg-default/5"
    >
      <div class="relative z-10">
        <h2 class="text-3xl sm:text-4xl font-black tracking-tight mb-4">
          {{ $t("manage.overview.welcome") }}
        </h2>
        <p class="text-default/60 max-w-2xl text-lg">
          {{ $t("manage.overview.description") }}
        </p>
      </div>
      <!-- Decorative element -->
      <div
        class="absolute -right-12 -top-12 w-64 h-64 bg-primary-500/10 blur-3xl rounded-full"
      ></div>
    </section>

    <!-- Quick Actions Grid -->
    <section>
      <div class="flex items-center space-x-3 mb-8">
        <div class="w-1.5 h-6 bg-primary-500"></div>
        <h3
          class="text-xs uppercase tracking-[0.3em] font-black text-primary-400"
        >
          {{ $t("manage.overview.quickActions") }}
        </h3>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <UCard
          v-for="action in quickActions"
          :key="action.to"
          class="group hover:border-primary-500/50 transition-all duration-300 cursor-pointer overflow-hidden relative"
          @click="navigateTo(action.to)"
        >
          <div class="flex flex-col h-full space-y-4">
            <div
              class="w-12 h-12 flex items-center justify-center bg-primary-500/10 text-primary-500 rounded-lg group-hover:bg-primary-500 group-hover:text-white transition-all duration-300"
            >
              <UIcon :name="action.icon" class="w-6 h-6" />
            </div>
            <div>
              <h4
                class="font-bold text-lg mb-1 group-hover:text-primary-400 transition-colors"
              >
                {{ action.label }}
              </h4>
              <p class="text-sm text-default/50">
                {{ action.description }}
              </p>
            </div>
          </div>
          <div
            class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <UIcon
              name="i-heroicons-arrow-up-right"
              class="w-5 h-5 text-primary-500"
            />
          </div>
        </UCard>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n();

const quickActions = computed(() => [
  {
    label: t("manage.tabs.backgrounds"),
    description: t("manage.overview.backgroundsDesc"),
    icon: "i-heroicons-photo",
    to: "/manage/backgrounds",
  },
  {
    label: t("manage.tabs.preferences"),
    description: t("manage.overview.preferencesDesc"),
    icon: "i-heroicons-adjustments-horizontal",
    to: "/manage/preferences",
  },
  {
    label: t("manage.tabs.modules"),
    description: t("manage.overview.modulesDesc"),
    icon: "i-heroicons-squares-2x2",
    to: "/manage/modules",
  },
  {
    label: t("manage.tabs.raw"),
    description: t("manage.overview.rawDesc"),
    icon: "i-heroicons-code-bracket",
    to: "/manage/raw",
  },
]);

const navigateTo = (to: string) => {
  useRouter().push(to);
};
</script>
