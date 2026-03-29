<template>
  <div class="space-y-12">
    <!-- Header with quick controls -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div>
        <h2 class="text-2xl sm:text-3xl font-bold text-default tracking-tight">
          {{ $t("manage.backgrounds.title") }}
        </h2>
        <p class="text-default/50 mt-1 text-sm sm:text-base">
          {{ $t("manage.backgrounds.subtitle") }}
        </p>
      </div>
      <div
        class="flex items-center space-x-2 sm:space-x-4 overflow-x-auto pb-2 sm:pb-0"
      >
        <UButton
          :icon="store.serverIsPaused ? 'i-lucide-play' : 'i-lucide-pause'"
          color="neutral"
          variant="subtle"
          :label="
            store.serverIsPaused
              ? $t('manage.backgrounds.resume')
              : $t('manage.backgrounds.pause')
          "
          size="md"
          sm:size="lg"
          class="shrink-0"
          @click="store.togglePause"
        />
        <UButton
          icon="i-lucide-skip-forward"
          color="neutral"
          variant="subtle"
          :label="$t('manage.backgrounds.next')"
          size="md"
          sm:size="lg"
          class="shrink-0"
          @click="store.triggerNextBackground"
        />
      </div>
    </div>

    <!-- Waiting List Section -->
    <div class="space-y-4">
      <div
        class="flex items-center justify-between border-b border-default pb-4"
      >
        <h3 class="text-xl font-bold text-default">
          {{ $t("manage.backgrounds.waitingList") }}
        </h3>
        <UBadge
          :label="store.serverWaitingList.length"
          color="primary"
          variant="subtle"
          size="lg"
        />
      </div>
      <div
        class="flex overflow-x-auto gap-4 pb-4 scrollbar-hide min-h-[90px] sm:min-h-[110px]"
      >
        <TransitionGroup name="list" tag="div" class="flex gap-4">
          <div
            v-for="(item, index) in store.serverWaitingList"
            :key="item.url + '-' + index"
            class="relative shrink-0 w-32 sm:w-40 aspect-video overflow-hidden border border-default bg-default/40 group"
          >
            <img
              v-if="item.type === 'image'"
              :src="item.url"
              class="w-full h-full object-cover"
            />
            <video
              v-else
              :src="`${item.url}#t=0.001`"
              class="w-full h-full object-cover"
              muted
            />
            <div
              class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              <UButton
                icon="i-lucide-x"
                color="error"
                variant="ghost"
                size="xs"
                @click="store.removeFromWaitingList(index)"
              />
            </div>
            <div
              class="absolute top-0 left-0 bg-primary-500 text-white text-[8px] px-1 font-bold"
            >
              #{{ index + 1 }}
            </div>
          </div>
        </TransitionGroup>

        <!-- Placeholder when empty -->
        <div
          v-if="store.serverWaitingList.length === 0"
          class="shrink-0 w-32 sm:w-40 aspect-video flex flex-col items-center justify-center border border-dashed border-default/30 bg-default/5 opacity-50 rounded-xs"
        >
          <UIcon name="i-lucide-clock" class="w-6 h-6 mb-2 text-default/20" />
          <span
            class="text-[9px] uppercase tracking-wider font-black text-center px-4 text-default/30 leading-tight"
          >
            {{ $t("manage.backgrounds.waitingListEmpty") }}
          </span>
        </div>
      </div>
    </div>

    <!-- Folder Selection Settings -->
    <div
      v-if="store.config"
      class="p-6 bg-default/5 border border-default rounded-lg"
    >
      <div class="flex items-center space-x-3 mb-6">
        <UIcon name="i-lucide-folder-open" class="w-6 h-6 text-primary-500" />
        <h3 class="text-xl font-bold text-default">
          {{ $t("manage.backgrounds.selectFolders") }}
        </h3>
        <span class="grow"></span>
        <Transition name="fade">
          <span
            v-if="saveStatus === 'success'"
            class="text-primary-400 text-sm font-medium flex items-center mr-4"
          >
            <UIcon name="i-heroicons-check-circle" class="mr-1 w-5 h-5" />
            {{ $t("common.saved") }}
          </span>
          <span
            v-else-if="saveStatus === 'error'"
            class="text-red-400 text-sm font-medium flex items-center mr-4"
          >
            <UIcon name="i-heroicons-exclamation-circle" class="mr-1 w-5 h-5" />
            {{ $t("common.failed") }}
          </span>
        </Transition>
        <UButton
          v-if="hasChanges"
          icon="i-heroicons-check"
          color="primary"
          size="sm"
          :loading="isSaving"
          :label="$t('common.save')"
          @click="saveFolderSettings"
        />
      </div>

      <div class="space-y-6" v-if="localConfig">
        <URadioGroup
          v-model="localConfig.useAllFolders"
          :items="[
            { label: $t('manage.backgrounds.allFolders'), value: true },
            { label: $t('manage.backgrounds.distinctFolders'), value: false },
          ]"
        />

        <div
          v-if="localConfig.useAllFolders === false"
          class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 pl-6 border-l-2 border-primary-500/20"
        >
          <div
            v-for="folder in availableFolders"
            :key="folder"
            class="flex items-center space-x-2"
          >
            <UCheckbox
              :label="folder === 'root' ? folder : folder.split('/').pop()"
              :model-value="localConfig.enabledFolders?.includes(folder)"
              @update:model-value="
                (val) => {
                  if (!localConfig) return;
                  if (val) {
                    if (!localConfig.enabledFolders)
                      localConfig.enabledFolders = [];
                    if (!localConfig.enabledFolders.includes(folder)) {
                      localConfig.enabledFolders.push(folder);
                    }
                  } else if (localConfig.enabledFolders) {
                    localConfig.enabledFolders =
                      localConfig.enabledFolders.filter(
                        (f: string) => f !== folder,
                      );
                  }
                }
              "
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { useConfigStore } from "~~/stores/config";

defineProps<{
  availableFolders: string[];
}>();

const store = useConfigStore();

const localConfig = ref<{
  useAllFolders?: boolean;
  enabledFolders?: string[];
} | null>(null);

const isSaving = ref(false);
const saveStatus = ref<"success" | "error" | null>(null);

const hasChanges = computed(() => {
  if (!store.config?.background || !localConfig.value) return false;
  
  if (store.config.background.useAllFolders !== localConfig.value.useAllFolders) return true;
  
  const originalFolders = store.config.background.enabledFolders || [];
  const localFolders = localConfig.value.enabledFolders || [];
  
  if (originalFolders.length !== localFolders.length) return true;
  
  // Check if arrays have same elements
  const sortedOriginal = [...originalFolders].sort();
  const sortedLocal = [...localFolders].sort();
  
  return !sortedOriginal.every((val, index) => val === sortedLocal[index]);
});

watch(
  () => store.config?.background,
  (newBg) => {
    if (newBg && !localConfig.value && !hasChanges.value) {
      localConfig.value = {
        useAllFolders: newBg.useAllFolders,
        enabledFolders: newBg.enabledFolders ? [...newBg.enabledFolders] : [],
      };
    }
  },
  { immediate: true, deep: true }
);

const saveFolderSettings = async () => {
  if (!store.config || !localConfig.value) return;
  
  isSaving.value = true;
  saveStatus.value = null;
  
  try {
    store.config.background.useAllFolders = localConfig.value.useAllFolders;
    store.config.background.enabledFolders = localConfig.value.enabledFolders ? [...localConfig.value.enabledFolders] : [];
    
    await store.saveConfig();
    saveStatus.value = "success";
    setTimeout(() => {
      saveStatus.value = null;
    }, 3000);
  } catch (error) {
    saveStatus.value = "error";
    console.error("Failed to save folder settings:", error);
  } finally {
    isSaving.value = false;
  }
};
</script>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
