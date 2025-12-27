<template>
  <div
    v-if="store.config"
    class="w-full max-w-2xl mx-auto glass-module p-8 rounded-3xl shadow-2xl backdrop-blur-md bg-white/10 border border-white/20 text-white"
  >
    <div class="flex items-center justify-between mb-8">
      <h2 class="text-2xl font-bold">Module Settings</h2>
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
          :loading="isSaving"
          label="Save Settings"
          @click="handleSaveSettings"
        />
      </div>
    </div>

    <div class="space-y-8">
      <div
        v-for="module in store.config.modules"
        :key="module.id"
        class="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4"
      >
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold capitalize">
            {{ module.module.replace("Module", "") }}
          </h3>
          <UCheckbox v-model="module.enabled" label="Enabled" />
        </div>

        <div
          v-if="module.enabled"
          class="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <UFormField
            label="Position"
            description="Where to display the module"
          >
            <USelect
              v-model="module.position"
              :items="[...MODULE_POSITIONS]"
              class="w-full"
            />
          </UFormField>
          <!-- Additional module-specific config could go here -->
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useDashboardStore, MODULE_POSITIONS } from "~~/stores/dashboard";

const store = useDashboardStore();
const isSaving = ref(false);
const saveStatus = ref<"success" | "error" | null>(null);

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
