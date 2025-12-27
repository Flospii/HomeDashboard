<template>
  <UCard
    v-if="store.config"
    variant="glassDark"
    class="!border-0 !shadow-none overflow-hidden"
    :ui="{
      body: 'p-8',
    }"
  >
    <template #header>
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-3xl font-bold text-(--ui-text) tracking-tight">
            Dashboard Settings
          </h2>
          <p class="text-(--ui-text)/50 mt-1">
            Configure how your dashboard looks and behaves
          </p>
        </div>
        <div class="flex items-center space-x-4">
          <Transition name="fade">
            <span
              v-if="saveStatus === 'success'"
              class="text-primary-400 text-sm font-medium flex items-center"
            >
              <UIcon name="i-heroicons-check-circle" class="mr-1 w-5 h-5" />
              Saved
            </span>
            <span
              v-else-if="saveStatus === 'error'"
              class="text-red-400 text-sm font-medium flex items-center"
            >
              <UIcon
                name="i-heroicons-exclamation-circle"
                class="mr-1 w-5 h-5"
              />
              Error
            </span>
          </Transition>
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
    </template>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
      <!-- Left Column: Visuals -->
      <div class="space-y-8">
        <h3
          class="text-sm font-bold uppercase tracking-widest text-primary-400/80"
        >
          Visuals & Transitions
        </h3>

        <UFormField
          label="Transition Mode"
          description="The animation style between backgrounds"
        >
          <USelect
            v-model="store.config.background.transitionMode"
            :items="[...TRANSITION_MODES]"
            size="xl"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Playback Order"
          description="Sequential or random playback"
        >
          <USelect
            v-model="store.config.background.playbackOrder"
            :items="[...PLAYBACK_MODES]"
            size="xl"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Rotation Interval (ms)"
          description="Time between background changes"
        >
          <UInput
            v-model.number="store.config.background.interval"
            type="number"
            step="1000"
            min="1000"
            size="xl"
            class="w-full"
          />
        </UFormField>
      </div>

      <!-- Right Column: Scanning & Polling -->
      <div class="space-y-8">
        <h3
          class="text-sm font-bold uppercase tracking-widest text-primary-400/80"
        >
          Local Discovery
        </h3>

        <UFormField
          label="Local Scanning"
          description="Automatically scan public/backgrounds folder"
        >
          <span class="text-sm text-(--ui-text)/70"
            >Enable Local Discovery</span
          >
          <USwitch v-model="store.config.background.useLocalBackgrounds" />
        </UFormField>

        <Transition name="slide-up">
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
              size="xl"
              class="w-full"
            />
          </UFormField>
        </Transition>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import {
  useDashboardStore,
  TRANSITION_MODES,
  PLAYBACK_MODES,
} from "~~/stores/dashboard";

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
