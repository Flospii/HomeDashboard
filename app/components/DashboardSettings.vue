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

      <!-- External URLs -->
      <div class="pt-6 border-t border-white/10">
        <h3 class="text-lg font-semibold mb-4">External Background URLs</h3>
        <div class="space-y-4">
          <div
            v-for="(item, index) in store.config.background.mediaUrlArray"
            :key="index"
            class="flex items-center space-x-4 bg-white/5 p-3 rounded-xl border border-white/10"
          >
            <div class="flex-1 min-w-0">
              <p class="text-sm truncate opacity-80">{{ item.url }}</p>
              <p class="text-xs opacity-40 uppercase">{{ item.type }}</p>
            </div>
            <UButton
              icon="i-heroicons-trash"
              color="error"
              variant="ghost"
              size="sm"
              @click="removeExternalUrl(index)"
            />
          </div>

          <div
            class="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white/5 rounded-xl border border-white/10"
          >
            <UInput
              v-model="newUrl.url"
              placeholder="https://example.com/image.jpg"
              class="md:col-span-2"
            />
            <USelect
              v-model="newUrl.type"
              :items="['image', 'video']"
              class="w-full"
            />
            <UButton
              label="Add External URL"
              icon="i-heroicons-plus"
              color="neutral"
              variant="subtle"
              class="md:col-span-3"
              :disabled="!newUrl.url"
              @click="addExternalUrl"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { useDashboardStore, TRANSITION_MODES } from "~~/stores/dashboard";

const store = useDashboardStore();
const isSaving = ref(false);
const saveStatus = ref<"success" | "error" | null>(null);

const newUrl = reactive({
  url: "",
  type: "image" as "image" | "video",
});

const addExternalUrl = () => {
  if (!newUrl.url || !store.config) return;
  store.config.background.mediaUrlArray.push({ ...newUrl });
  newUrl.url = "";
  newUrl.type = "image";
};

const removeExternalUrl = (index: number) => {
  if (!store.config) return;
  store.config.background.mediaUrlArray.splice(index, 1);
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
