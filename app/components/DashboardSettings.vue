<template>
  <div
    v-if="store.config"
    class="w-full max-w-2xl mx-auto glass-module p-8 rounded-3xl shadow-2xl backdrop-blur-md bg-white/10 border border-white/20 text-white"
  >
    <div class="flex items-center justify-between mb-8">
      <h2 class="text-2xl font-bold">Dashboard Settings</h2>
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

    <div class="space-y-6">
      <!-- Transition Mode -->
      <UFormField
        label="Transition Mode"
        description="The animation style between backgrounds"
      >
        <USelect
          v-model="store.config.background.transitionMode"
          :items="[...TRANSITION_MODES]"
          class="w-full"
        />
      </UFormField>

      <!-- Interval -->
      <UFormField
        label="Rotation Interval (ms)"
        description="Time between background changes"
      >
        <UInput
          v-model.number="store.config.background.interval"
          type="number"
          step="1000"
          min="1000"
          class="w-full"
        />
      </UFormField>

      <!-- Local Backgrounds -->
      <UFormField
        label="Local Backgrounds"
        description="Automatically scan public/backgrounds folder"
      >
        <UCheckbox
          v-model="store.config.background.useLocalBackgrounds"
          label="Enable Local Scanning"
        />
      </UFormField>

      <!-- Polling Interval -->
      <UFormField
        v-if="store.config.background.useLocalBackgrounds"
        label="Polling Interval (ms)"
        description="How often to check for new local files"
      >
        <UInput
          v-model.number="store.config.background.localPollingInterval"
          type="number"
          step="1000"
          min="5000"
          class="w-full"
        />
      </UFormField>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useDashboardStore, TRANSITION_MODES } from "~~/stores/dashboard";

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
    console.error("Failed to save settings:", error);
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
