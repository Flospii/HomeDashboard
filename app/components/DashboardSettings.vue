<template>
  <UCard
    v-if="store.config"
    variant="glassDark"
    class="border-0! shadow-none! overflow-hidden"
    :ui="{
      body: 'p-8',
    }"
  >
    <template #header>
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
      >
        <div>
          <h2
            class="text-2xl sm:text-3xl font-bold text-default tracking-tight"
          >
            {{ $t("manage.preferences.title") }}
          </h2>
          <p class="text-default/50 mt-1 text-sm sm:text-base">
            {{ $t("manage.preferences.subtitle") }}
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

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
      <!-- Left Column: Visuals -->
      <div class="space-y-8">
        <h3
          class="text-sm font-bold uppercase tracking-widest text-primary-400/80"
        >
          {{ $t("manage.preferences.visuals") }}
        </h3>

        <UFormField
          :label="$t('manage.preferences.transitionMode')"
          :description="$t('manage.preferences.transitionDescription')"
        >
          <USelect
            v-model="store.config.background.transitionMode"
            :items="[...TRANSITION_MODES]"
            size="xl"
            class="w-full"
          />
        </UFormField>

        <UFormField
          :label="$t('manage.preferences.playbackOrder')"
          :description="$t('manage.preferences.playbackDescription')"
        >
          <USelect
            v-model="store.config.background.playbackOrder"
            :items="[...PLAYBACK_MODES]"
            size="xl"
            class="w-full"
          />
        </UFormField>

        <UFormField
          :label="$t('manage.preferences.interval')"
          :description="$t('manage.preferences.intervalDescription')"
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

        <UFormField
          :label="$t('manage.preferences.videoPlayback')"
          :description="$t('manage.preferences.videoDescription')"
        >
          <USelect
            v-model="store.config.background.videoPlaybackMode"
            :items="[...VIDEO_PLAYBACK_MODES]"
            size="xl"
            class="w-full"
          />
        </UFormField>

        <UFormField
          :label="$t('manage.preferences.lowPowerMode')"
          :description="$t('manage.preferences.lowPowerDescription')"
        >
          <div class="flex items-center justify-between">
            <span class="text-sm text-default/70">{{
              $t("manage.preferences.enableLowPower")
            }}</span>
            <USwitch v-model="store.config.background.lowPowerMode" />
          </div>
        </UFormField>
      </div>

      <!-- Center-Right Column (shifted): Language and Global Settings -->
      <div class="space-y-8">
        <h3
          class="text-sm font-bold uppercase tracking-widest text-primary-400/80"
        >
          General Settings
        </h3>

        <UFormField
          :label="$t('manage.preferences.language')"
          :description="$t('manage.preferences.languageDescription')"
        >
          <USelect
            v-model="selectedLanguage"
            :items="locales"
            value-key="code"
            label-key="name"
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
          {{ $t("manage.preferences.localDiscovery") }}
        </h3>

        <UFormField
          :label="$t('manage.preferences.localScanning')"
          :description="$t('manage.preferences.localScanningDescription')"
        >
          <span class="text-sm text-default/70">{{
            $t("manage.preferences.enableDiscovery")
          }}</span>
          <USwitch v-model="store.config.background.useLocalBackgrounds" />
        </UFormField>

        <Transition name="slide-up">
          <UFormField
            v-if="store.config.background.useLocalBackgrounds"
            :label="$t('manage.preferences.pollingInterval')"
            :description="$t('manage.preferences.pollingDescription')"
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
  TRANSITION_MODES,
  PLAYBACK_MODES,
  VIDEO_PLAYBACK_MODES,
} from "../types/config";
import { useConfigStore } from "~~/stores/config";

const store = useConfigStore();
const { locales: availableLocales, setLocale, locale } = useI18n();
const isSaving = ref(false);
const saveStatus = ref<"success" | "error" | null>(null);

const selectedLanguage = ref(store.config?.language || locale.value);

watch(
  () => store.config?.language,
  (newLang) => {
    if (newLang) {
      selectedLanguage.value = newLang;
    }
  },
  { immediate: true }
);

const locales = computed(() => {
  return availableLocales.value.map((l: any) => ({
    code: l.code,
    name: l.name,
  }));
});

const handleSaveSettings = async () => {
  isSaving.value = true;
  saveStatus.value = null;
  try {
    if (store.config) {
      store.config.language = selectedLanguage.value;
    }
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
