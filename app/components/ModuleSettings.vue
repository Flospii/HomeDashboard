<template>
  <UCard
    v-if="store.config"
    variant="glass"
    class="w-full max-w-2xl mx-auto !border-0 !shadow-none overflow-hidden"
    :ui="{ body: 'p-8' }"
  >
    <div class="flex items-center justify-between mb-8">
      <h2 class="text-2xl font-bold text-(--ui-text)">Module Settings</h2>
      <div class="flex items-center space-x-4">
        <span
          v-if="saveStatus === 'success'"
          class="text-green-400 text-sm animate-fade-in"
        >
          Settings saved!
        </span>
        <span
          v-if="saveStatus === 'error'"
          class="text-red-400 text-sm animate-fade-in"
        >
          Failed to save
        </span>
        <UButton
          icon="i-heroicons-check"
          color="primary"
          size="lg"
          :loading="isSaving"
          label="Save Changes"
          class="px-6"
          @click="handleSaveSettings"
        />
      </div>
    </div>
    <div class="space-y-8">
      <UCard
        v-for="mod in store.config?.modules"
        :key="mod.id"
        variant="glassDark"
        class="overflow-hidden border border-(--ui-border)"
        :ui="{ body: 'p-0' }"
      >
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
              <h3 class="text-xl font-bold text-(--ui-text) capitalize">
                {{ mod.module }} Module
              </h3>
              <p
                class="text-xs text-(--ui-text)/40 uppercase tracking-widest font-bold"
              >
                ID: {{ mod.id }}
              </p>
            </div>
          </div>
          <USwitch v-model="mod.enabled" size="lg" />
        </div>

        <Transition name="slide-up">
          <div
            v-if="mod.enabled"
            class="p-8 space-y-8 border-t border-(--ui-border)"
          >
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <!-- Position -->
              <UFormField
                label="Screen Position"
                description="Where this module appears on the dashboard"
              >
                <USelect
                  v-model="mod.position"
                  :items="[...MODULE_POSITIONS]"
                  size="xl"
                  class="w-full"
                />
              </UFormField>

              <!-- Specific Config -->
              <div v-if="mod.module === 'clock'" class="space-y-4">
                <UFormField
                  label="Display Seconds"
                  description="Show or hide the seconds counter"
                >
                  <div
                    class="flex items-center justify-between p-4 bg-(--ui-bg)/5 border border-(--ui-border)"
                  >
                    <span class="text-sm text-(--ui-text)/70"
                      >Enable Seconds</span
                    >
                    <USwitch v-model="(mod.config as any).displaySeconds" />
                  </div>
                </UFormField>
              </div>

              <!-- Weather Config -->
              <div v-if="mod.module === 'weather'" class="space-y-6">
                <UFormField label="Weather Provider">
                  <USelect
                    v-model="(mod.config as any).weatherProvider"
                    :items="['openmeteo']"
                    size="xl"
                    class="w-full"
                  />
                </UFormField>
                <div class="grid grid-cols-2 gap-4">
                  <UFormField label="Latitude">
                    <UInput
                      v-model.number="(mod.config as any).lat"
                      type="number"
                      step="0.0001"
                      size="xl"
                    />
                  </UFormField>
                  <UFormField label="Longitude">
                    <UInput
                      v-model.number="(mod.config as any).lon"
                      type="number"
                      step="0.0001"
                      size="xl"
                    />
                  </UFormField>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </UCard>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useConfigStore } from "~~/stores/config";
import { MODULE_POSITIONS } from "~/types/config";

const store = useConfigStore();
const isSaving = ref(false);
const saveStatus = ref<"success" | "error" | null>(null);

const getModuleIcon = (type: string) => {
  switch (type) {
    case "clock":
      return "i-heroicons-clock";
    case "weather":
      return "i-heroicons-cloud";
    case "news":
      return "i-heroicons-newspaper";
    default:
      return "i-heroicons-cube";
  }
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
