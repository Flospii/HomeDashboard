<template>
  <UCard variant="glass" class="w-full max-w-4xl mx-auto border-0! shadow-none! overflow-hidden" :ui="{ body: 'p-8' }">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h2 class="text-2xl font-bold text-default">Raw Configuration</h2>
        <p class="text-sm text-(--ui-text)/50 mt-1">
          Edit the dashboard configuration directly as JSON. Be careful!
        </p>
      </div>
      <div class="flex items-center space-x-4">
        <span v-if="saveStatus === 'success'" class="text-green-400 text-sm animate-fade-in">
          Config saved!
        </span>
        <span v-if="saveStatus === 'error'" class="text-red-400 text-sm animate-fade-in">
          {{ errorMessage || "Failed to save" }}
        </span>
        <UButton icon="i-heroicons-check" color="primary" size="lg" :loading="isSaving" label="Save Config" class="px-6"
          @click="handleSaveConfig" />
      </div>
    </div>

    <div class="relative">
      <UTextarea v-model="jsonContent" :rows="25" variant="soft"
        class="font-mono text-sm w-full bg-(--ui-bg)/5 p-4 focus:ring-2 focus:ring-primary-500/50 transition-all"
        placeholder="{ ... }" :ui="{ base: 'resize-none' }" />
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useConfigStore } from "~~/stores/config";

const store = useConfigStore();
const isSaving = ref(false);
const saveStatus = ref<"success" | "error" | null>(null);
const errorMessage = ref("");
const jsonContent = ref("");

const updateJsonContent = () => {
  if (store.config) {
    jsonContent.value = JSON.stringify(store.config, null, 2);
  }
};

onMounted(() => {
  updateJsonContent();
});

// Update editor if store config changes externally
watch(
  () => store.config,
  () => {
    if (!isSaving.value) {
      updateJsonContent();
    }
  },
  { deep: true }
);

const handleSaveConfig = async () => {
  isSaving.value = true;
  saveStatus.value = null;
  errorMessage.value = "";

  try {
    // Validate JSON
    let parsedConfig;
    try {
      parsedConfig = JSON.parse(jsonContent.value);
    } catch (e: any) {
      throw new Error(`Invalid JSON: ${e.message}`);
    }

    // Update store
    store.config = parsedConfig;

    // Save to server
    await store.saveConfig();

    saveStatus.value = "success";
    setTimeout(() => {
      saveStatus.value = null;
    }, 3000);
  } catch (error: any) {
    console.error("Failed to save raw config:", error);
    saveStatus.value = "error";
    errorMessage.value = error.message;
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
