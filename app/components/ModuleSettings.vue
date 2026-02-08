<template>
  <UCard
    v-if="store.config"
    variant="glassDark"
    class="w-full max-w-2xl mx-auto border-0! shadow-none! overflow-hidden"
    :ui="{
      body: 'p-8',
    }"
  >
    <template #header>
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h2
            class="text-2xl sm:text-3xl font-bold text-default tracking-tight"
          >
            {{ $t("manage.modules.title") }}
          </h2>
          <p class="text-default/50 mt-1 text-sm sm:text-base">
            {{ $t("manage.modules.subtitle") }}
          </p>
        </div>
        <div class="flex items-center justify-between sm:justify-end space-x-4">
          <Transition name="fade">
            <span
              v-if="saveStatus === 'success'"
              class="text-primary-400 text-sm font-medium flex items-center"
            >
              <UIcon name="i-heroicons-check-circle" class="mr-1 w-5 h-5" />
              {{ $t("common.saved") }}
            </span>
            <span
              v-else-if="saveStatus === 'error'"
              class="text-red-400 text-sm font-medium flex items-center"
            >
              <UIcon
                name="i-heroicons-exclamation-circle"
                class="mr-1 w-5 h-5"
              />
              {{ $t("common.failed") }}
            </span>
          </Transition>
          <UButton
            icon="i-heroicons-check"
            color="primary"
            size="lg"
            :loading="isSaving"
            :label="$t('common.save')"
            class="px-6"
            @click="handleSaveSettings"
          />
        </div>
      </div>
    </template>
    <!-- Add Module Button - Top Position -->
    <div class="mb-8 flex justify-center">
      <UDropdownMenu :items="availableModules" :ui="{ content: 'w-64' }">
        <UButton
          icon="i-heroicons-plus"
          color="primary"
          variant="subtle"
          size="xl"
          :label="$t('manage.modules.addModule')"
          class="px-8 border-2 border-dashed border-primary-500/30 hover:border-primary-500/50 hover:bg-primary-500/10 transition-all"
        />
      </UDropdownMenu>
    </div>

    <div class="space-y-8">
      <UCard
        v-for="mod in store.config?.modules"
        :key="mod.id"
        variant="glassDark"
        class="overflow-hidden border border-default"
        :ui="{ body: 'p-0' }"
      >
        <!-- Module Header -->
        <div class="p-6 flex items-center justify-between bg-(--ui-bg)/5">
          <div class="flex items-center space-x-4">
            <div
              class="w-12 h-12 bg-primary-500/20 flex items-center justify-center"
            >
              <UIcon
                :name="getModuleIcon(mod.module)"
                class="w-6 h-6 text-primary-400"
              />
            </div>
            <div>
              <h3 class="text-xl font-bold text-default">
                {{ $t(`modules.${mod.module}.name`) }}
              </h3>
              <p
                class="text-xs text-default/40 uppercase tracking-widest font-bold"
              >
                ID: {{ mod.id }}
              </p>
            </div>
          </div>
          <USwitch v-model="mod.enabled" size="lg" />
        </div>

        <Transition name="slide-up">
          <div v-if="mod.enabled" class="border-t border-default">
            <!-- Base Module Settings Section -->
            <div class="p-6 space-y-6 bg-(--ui-bg)/3">
              <div class="flex items-center justify-between">
                <span
                  class="text-xs text-default/50 uppercase tracking-widest font-bold"
                >
                  {{ $t("manage.modules.baseSettings") }}
                </span>
              </div>

              <!-- Position -->
              <UFormField
                :label="$t('manage.modules.screenPosition')"
                :description="$t('manage.modules.positionDescription')"
              >
                <USelect
                  v-model="mod.position"
                  :items="[...MODULE_POSITIONS]"
                  size="xl"
                  class="w-full"
                />
              </UFormField>

              <!-- Delete Module -->
              <div class="pt-2">
                <UButton
                  icon="i-heroicons-trash"
                  color="error"
                  variant="soft"
                  size="sm"
                  :label="$t('manage.modules.deleteModule')"
                  @click="handleDeleteModule(mod)"
                />
              </div>
            </div>

            <!-- Module-Specific Settings Section -->
            <div
              v-if="getSettingsComponent(mod.module)"
              class="p-6 space-y-6 border-t border-default"
            >
              <div class="flex items-center justify-between">
                <span
                  class="text-xs text-default/50 uppercase tracking-widest font-bold"
                >
                  {{ $t("manage.modules.moduleSettings") }}
                </span>
              </div>
              <component
                :is="getSettingsComponent(mod.module)"
                v-model="mod.config"
              />
            </div>
          </div>
        </Transition>
      </UCard>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useConfigStore } from "~~/stores/config";
import { MODULE_POSITIONS } from "../types/config";
import { AVAILABLE_MODULES, getModuleDefinition } from "./modules/index";

const { t } = useI18n();
const store = useConfigStore();
const isSaving = ref(false);
const saveStatus = ref<"success" | "error" | null>(null);

const getModuleIcon = (type: string) => {
  return getModuleDefinition(type)?.icon || "i-heroicons-cube";
};

const getModuleName = (type: string) => {
  return getModuleDefinition(type)?.name || type;
};

const getSettingsComponent = (type: string) => {
  return getModuleDefinition(type)?.settingsComponent;
};

const handleSaveSettings = async () => {
  isSaving.value = true;
  saveStatus.value = null;
  try {
    await store.saveConfig();
    saveStatus.value = "success";
    setTimeout(() => {
      saveStatus.value = null;
    }, 3000);
  } catch (error) {
    console.error("Failed to save module settings:", error);
    saveStatus.value = "error";
  } finally {
    isSaving.value = false;
  }
};

const availableModules = computed(() => [
  AVAILABLE_MODULES.map((m) => ({
    label: t(`modules.${m.id}.name`),
    icon: m.icon,
    onSelect: () => addModule(m.id),
  })),
]);

const addModule = (type: string) => {
  if (!store.config) return;

  const definition = getModuleDefinition(type);
  if (!definition) return;

  const id = `${type}-${Date.now()}`;
  const defaultConfig = JSON.parse(JSON.stringify(definition.defaultConfig));

  store.config.modules.push({
    id,
    module: type,
    position: "top_left",
    enabled: true,
    config: defaultConfig,
  });
};

const handleDeleteModule = (mod: any) => {
  if (!store.config) return;
  if (confirm(t("manage.modules.deleteConfirm"))) {
    const index = store.config.modules.findIndex((m) => m.id === mod.id);
    if (index !== -1) {
      store.config.modules.splice(index, 1);
    }
  }
};
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
