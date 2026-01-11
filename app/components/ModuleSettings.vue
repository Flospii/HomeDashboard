<template>
  <UCard v-if="store.config" variant="glass" class="w-full max-w-2xl mx-auto !border-0 !shadow-none overflow-hidden"
    :ui="{ body: 'p-8' }">
    <div class="flex items-center justify-between mb-8">
      <h2 class="text-2xl font-bold text-(--ui-text)">
        {{ $t("manage.modules.title") }}
      </h2>
      <div class="flex items-center space-x-4">
        <span v-if="saveStatus === 'success'" class="text-green-400 text-sm animate-fade-in">
          {{ $t("common.saved") }}
        </span>
        <span v-if="saveStatus === 'error'" class="text-red-400 text-sm animate-fade-in">
          {{ $t("common.failed") }}
        </span>
        <UButton icon="i-heroicons-check" color="primary" size="lg" :loading="isSaving" :label="$t('common.save')"
          class="px-6" @click="handleSaveSettings" />
      </div>
    </div>
    <div class="space-y-8">
      <UCard v-for="mod in store.config?.modules" :key="mod.id" variant="glassDark"
        class="overflow-hidden border border-default" :ui="{ body: 'p-0' }">
        <div class="p-6 flex items-center justify-between bg-(--ui-bg)/5">
          <div class="flex items-center space-x-4">
            <div class="w-12 h-12 bg-primary-500/20 flex items-center justify-center">
              <UIcon :name="getModuleIcon(mod.module)" class="w-6 h-6 text-primary-400" />
            </div>
            <div>
              <h3 class="text-xl font-bold text-(--ui-text) capitalize">
                {{ mod.module }} Module
              </h3>
              <p class="text-xs text-(--ui-text)/40 uppercase tracking-widest font-bold">
                ID: {{ mod.id }}
              </p>
            </div>
          </div>
          <div class="flex items-center space-x-4">
            <UButton icon="i-heroicons-trash" color="error" variant="ghost" size="sm"
              @click="handleDeleteModule(mod)" />
            <USwitch v-model="mod.enabled" size="lg" />
          </div>
        </div>

        <Transition name="slide-up">
          <div v-if="mod.enabled" class="p-8 space-y-8 border-t border-default">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <!-- Position -->
              <UFormField :label="$t('manage.modules.screenPosition')"
                :description="$t('manage.modules.positionDescription')">
                <USelect v-model="mod.position" :items="[...MODULE_POSITIONS]" size="xl" class="w-full" />
              </UFormField>

              <!-- Specific Config -->
              <div v-if="mod.module === 'clock'" class="space-y-4">
                <UFormField :label="$t('manage.modules.clock.displaySeconds')"
                  :description="$t('manage.modules.clock.secondsDescription')">
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-(--ui-text)/70">Enable Seconds</span>
                    <USwitch v-model="(mod.config as any).displaySeconds" />
                  </div>
                </UFormField>
              </div>

              <!-- Weather Config -->
              <div v-if="mod.module === 'weather'" class="space-y-6">
                <UFormField label="Weather Provider">
                  <USelect v-model="(mod.config as any).weatherProvider" :items="['openmeteo']" size="xl"
                    class="w-full" />
                </UFormField>
                <div class="grid grid-cols-2 gap-4">
                  <UFormField label="Latitude">
                    <UInput v-model.number="(mod.config as any).lat" type="number" size="md" placeholder="48.0986" />
                  </UFormField>
                  <UFormField label="Longitude">
                    <UInput v-model.number="(mod.config as any).lon" type="number" size="md" placeholder="14.0353" />
                  </UFormField>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <UFormField :label="$t('manage.modules.weather.showProvider')">
                    <USwitch v-model="(mod.config as any).showProvider" />
                  </UFormField>
                  <UFormField :label="$t('manage.modules.weather.showWindSpeed')">
                    <USwitch v-model="(mod.config as any).showWindSpeed" />
                  </UFormField>
                  <UFormField :label="$t('manage.modules.weather.showHumidity')">
                    <USwitch v-model="(mod.config as any).showHumidity" />
                  </UFormField>
                  <UFormField :label="$t('manage.modules.weather.showSunriseSunset')">
                    <USwitch v-model="(mod.config as any).showSunriseSunset" />
                  </UFormField>
                  <UFormField :label="$t('manage.modules.weather.showLocation')">
                    <USwitch v-model="(mod.config as any).showLocation" />
                  </UFormField>
                </div>
              </div>

              <!-- News Config -->
              <div v-if="mod.module === 'news'" class="space-y-6">
                <div class="space-y-4">
                  <div class="flex items-center justify-between">
                    <h4 class="text-sm font-bold text-(--ui-text)/60 uppercase tracking-widest">
                      RSS Feeds
                    </h4>
                    <UButton icon="i-heroicons-plus" size="xs" variant="ghost" label="Add Feed" @click="
                      (mod.config as any).feeds.push({ title: '', url: '' })
                      " />
                  </div>

                  <div v-for="(feed, fIdx) in (mod.config as any).feeds" :key="fIdx"
                    class="grid grid-cols-12 gap-2 items-start">
                    <div class="col-span-4">
                      <UInput v-model="feed.title" placeholder="Feed Title" size="md" />
                    </div>
                    <div class="col-span-7">
                      <UInput v-model="feed.url" placeholder="RSS URL" size="md" />
                    </div>
                    <div class="col-span-1 flex justify-end">
                      <UButton icon="i-heroicons-trash" size="xs" color="error" variant="ghost"
                        @click="(mod.config as any).feeds.splice(fIdx, 1)" />
                    </div>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <UFormField label="Show Source">
                    <USwitch v-model="(mod.config as any).showSourceTitle" />
                  </UFormField>
                  <UFormField label="Show Date">
                    <USwitch v-model="(mod.config as any).showPublishDate" />
                  </UFormField>
                </div>
              </div>

              <!-- Background Metadata Config -->
              <div v-if="mod.module === 'background-metadata'" class="space-y-6">
                <div class="grid grid-cols-2 gap-4">
                  <UFormField :label="$t('manage.modules.metadata.fileName')">
                    <USwitch v-model="(mod.config as any).showFileName" />
                  </UFormField>
                  <UFormField :label="$t('manage.modules.metadata.fileSize')">
                    <USwitch v-model="(mod.config as any).showFileSize" />
                  </UFormField>
                  <UFormField :label="$t('manage.modules.metadata.mimeType')">
                    <USwitch v-model="(mod.config as any).showMimeType" />
                  </UFormField>
                  <UFormField :label="$t('manage.modules.metadata.gps')">
                    <USwitch v-model="(mod.config as any).showGPS" />
                  </UFormField>
                  <UFormField :label="$t('manage.modules.metadata.createdAt')">
                    <USwitch v-model="(mod.config as any).showCreatedAt" />
                  </UFormField>
                  <UFormField :label="$t('manage.modules.metadata.modifiedAt')">
                    <USwitch v-model="(mod.config as any).showModifiedAt" />
                  </UFormField>
                </div>
              </div>

              <!-- QR Code Config -->
              <div v-if="mod.module === 'qrcode'" class="space-y-6">
                <UFormField :label="$t('manage.modules.qrcode.type')"
                  :description="$t('manage.modules.qrcode.typeDescription')">
                  <USelect v-model="(mod.config as any).type" :items="[
                    { label: $t('manage.modules.qrcode.custom'), value: 'custom' },
                    { label: $t('manage.modules.qrcode.mediaUpload'), value: 'media-upload' }
                  ]" size="xl" class="w-full" />
                </UFormField>

                <UFormField :label="$t('manage.modules.qrcode.title')"
                  :description="$t('manage.modules.qrcode.titleDescription')">
                  <UInput v-model="(mod.config as any).title" placeholder="e.g. Scan to Upload" size="xl" />
                </UFormField>

                <UFormField v-if="(mod.config as any).type === 'custom'" :label="$t('manage.modules.qrcode.url')"
                  :description="$t('manage.modules.qrcode.urlDescription')">
                  <UInput v-model="(mod.config as any).customUrl" placeholder="https://..." size="xl" />
                </UFormField>
              </div>
            </div>
          </div>
        </Transition>
      </UCard>
    </div>

    <!-- Add Module Button -->
    <div class="mt-12 flex justify-center">
      <UDropdownMenu :items="availableModules" :ui="{ content: 'w-64' }">
        <UButton icon="i-heroicons-plus" color="neutral" variant="subtle" size="xl"
          :label="$t('manage.modules.addModule')"
          class="px-8 border-2 border-dashed border-default hover:border-primary-500/50 hover:bg-primary-500/5 transition-all" />
      </UDropdownMenu>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useConfigStore } from "~~/stores/config";
import { MODULE_POSITIONS } from "../types/config";

const { t } = useI18n();
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
    case "background-metadata":
      return "i-heroicons-information-circle";
    case "qrcode":
      return "i-heroicons-qr-code";
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

const availableModules = [
  [
    {
      label: "Clock",
      icon: "i-heroicons-clock",
      onSelect: () => addModule("clock"),
    },
    {
      label: "Weather",
      icon: "i-heroicons-cloud",
      onSelect: () => addModule("weather"),
    },
    {
      label: "News",
      icon: "i-heroicons-newspaper",
      onSelect: () => addModule("news"),
    },
    {
      label: "Background Metadata",
      icon: "i-heroicons-information-circle",
      onSelect: () => addModule("background-metadata"),
    },
    {
      label: "QR Code",
      icon: "i-heroicons-qr-code",
      onSelect: () => addModule("qrcode"),
    },
  ],
];

const addModule = (type: string) => {
  if (!store.config) return;

  const id = `${type}-${Date.now()}`;
  const defaultConfig: any = {};

  switch (type) {
    case "clock":
      Object.assign(defaultConfig, { displaySeconds: true });
      break;
    case "weather":
      Object.assign(defaultConfig, {
        weatherProvider: "openmeteo",
        type: "current",
        lat: 48.0862,
        lon: 14.0433,
        showProvider: true,
        showWindSpeed: true,
        showHumidity: true,
        showSunriseSunset: true,
        showLocation: true,
      });
      break;
    case "news":
      Object.assign(defaultConfig, {
        feeds: [{ title: "Der Standard", url: "https://www.derstandard.at/rss" }],
        showSourceTitle: true,
        showPublishDate: true,
      });
      break;
    case "background-metadata":
      Object.assign(defaultConfig, {
        showFileName: false,
        showFileSize: false,
        showMimeType: false,
        showGPS: true,
        showCreatedAt: true,
        showModifiedAt: false,
      });
      break;
    case "qrcode":
      Object.assign(defaultConfig, {
        type: "media-upload",
        title: "Upload Media",
      });
      break;
  }

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
