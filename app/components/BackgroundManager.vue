<template>
  <UCard variant="glassDark" class="border-0! shadow-none! overflow-hidden">
    <template #header>
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h2
            class="text-2xl sm:text-3xl font-bold text-default tracking-tight"
          >
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
            :icon="
              store.serverIsPaused ? 'i-heroicons-play' : 'i-heroicons-pause'
            "
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
            icon="i-heroicons-forward"
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
    </template>

    <!-- Add Section -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
      <!-- Local Upload -->
      <div
        class="border-2 border-dashed p-10 text-center transition-all cursor-pointer group flex flex-col justify-center items-center relative overflow-hidden"
        :class="[
          isDragging
            ? 'border-primary-500 bg-primary-500/10'
            : 'border-default hover:border-primary-500/50 hover:bg-primary-500/5',
          isUploading ? 'pointer-events-none opacity-50' : '',
        ]"
        @click="triggerFileInput"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
      >
        <!-- Loading Overlay -->
        <div
          v-if="isUploading"
          class="absolute inset-0 bg-(--ui-bg)/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 z-20"
        >
          <UIcon
            name="i-heroicons-arrow-path"
            class="w-10 h-10 text-primary-500 animate-spin mb-4"
          />
          <p
            class="text-xs font-black text-primary-500 uppercase tracking-[0.2em]"
          >
            {{ $t("manage.backgrounds.uploading") }} ({{ uploadProgress }}%)
          </p>
          <UProgress
            v-model="uploadProgress"
            class="mt-6 w-48"
            color="primary"
          />
        </div>

        <div
          class="w-16 h-16 bg-(--ui-bg)/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
          :class="{ 'scale-110': isDragging }"
        >
          <UIcon
            :name="
              isDragging
                ? 'i-heroicons-arrow-down-tray'
                : 'i-heroicons-cloud-arrow-up'
            "
            class="w-8 h-8 transition-colors"
            :class="
              isDragging
                ? 'text-primary-500'
                : 'text-default/40 group-hover:text-primary-400'
            "
          />
        </div>
        <h3 class="text-lg font-semibold text-default mb-1">
          {{
            isDragging
              ? $t("manage.backgrounds.dropToUpload")
              : $t("manage.backgrounds.uploadLocal")
          }}
        </h3>
        <p class="text-sm text-default/40">
          {{ $t("manage.backgrounds.uploadSubtitle") }}
        </p>
        <input
          ref="fileInput"
          type="file"
          class="hidden"
          accept="image/*,video/*"
          multiple
          @change="handleFileUpload"
        />
      </div>

      <!-- External URL -->
      <UCard
        :ui="{ body: 'p-10' }"
        class="bg-(--ui-bg)/5 shadow-none border border-default"
      >
        <h3 class="text-lg font-semibold text-default mb-4">
          {{ $t("manage.backgrounds.addExternal") }}
        </h3>
        <div class="space-y-6">
          <UFormField :label="$t('manage.backgrounds.resourceUrl')">
            <UInput
              v-model="newExternal.url"
              :placeholder="$t('common.loading') + '...'"
              size="xl"
              class="w-full"
            />
          </UFormField>
          <div class="flex flex-col sm:flex-row gap-4">
            <UFormField :label="$t('manage.backgrounds.type')" class="flex-1">
              <USelect
                v-model="newExternal.type"
                :items="['image', 'video']"
                size="xl"
                class="w-full"
              />
            </UFormField>
            <div class="flex items-end">
              <UButton
                :label="$t('manage.backgrounds.addResource')"
                icon="i-heroicons-plus"
                color="primary"
                size="xl"
                class="w-full sm:px-8"
                :disabled="!newExternal.url"
                @click="addExternalUrl"
              />
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Waiting List Section -->
    <div v-if="store.serverWaitingList.length > 0" class="mb-12 space-y-4">
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
      <div class="flex overflow-x-auto gap-4 pb-4 scrollbar-hide">
        <div
          v-for="(item, index) in store.serverWaitingList"
          :key="item.url + index"
          class="relative flex-shrink-0 w-32 sm:w-40 aspect-video overflow-hidden border border-default bg-(--ui-bg)/40 group"
        >
          <img
            v-if="item.type === 'image'"
            :src="item.url"
            class="w-full h-full object-cover"
          />
          <video
            v-else
            :src="item.url"
            class="w-full h-full object-cover"
            muted
          />
          <div
            class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          >
            <UButton
              icon="i-heroicons-x-mark"
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
      </div>
    </div>

    <!-- Status Messages (Legacy, removed in favor of overlay) -->

    <!-- Media Gallery -->
    <div class="space-y-8">
      <div
        class="flex items-center justify-between border-b border-default pb-4"
      >
        <h3 class="text-xl font-bold text-default">
          {{ $t("manage.backgrounds.gallery") }}
        </h3>
        <div class="flex flex-col sm:flex-row sm:items-center gap-4">
          <UButton
            icon="i-heroicons-archive-box-arrow-down"
            color="neutral"
            variant="subtle"
            :label="$t('manage.backgrounds.exportZip')"
            size="sm"
            class="w-full sm:w-auto"
            @click="downloadZip"
          />
          <UBadge
            :label="
              $t('manage.backgrounds.items', {
                count: allBackgrounds.length,
              })
            "
            color="neutral"
            variant="subtle"
            size="lg"
            class="w-full sm:w-auto justify-center"
          />
        </div>
      </div>

      <div
        v-if="allBackgrounds.length === 0"
        class="text-center py-20 bg-(--ui-bg)/5 border border-default"
      >
        <UIcon
          name="i-heroicons-photo"
          class="w-16 h-16 mx-auto mb-4 opacity-10"
        />
        <p class="text-default/30 text-lg">
          {{ $t("manage.backgrounds.noBackgrounds") }}
        </p>
      </div>

      <div
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        <div
          v-for="(item, index) in allBackgrounds"
          :key="item.url"
          class="relative group aspect-video overflow-hidden border border-default bg-(--ui-bg)/40 shadow-xl"
        >
          <!-- Preview -->
          <img
            v-if="item.type === 'image'"
            :src="item.url"
            class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <video
            v-else
            :src="item.url"
            class="w-full h-full object-cover"
            muted
          />

          <!-- Overlay Actions -->
          <div
            class="absolute inset-0 sm:bg-(--ui-bg)/60 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-4"
          >
            <UButton
              icon="i-heroicons-clock"
              color="primary"
              variant="solid"
              size="xl"
              class="shadow-2xl scale-90 sm:scale-75 group-hover:scale-100 transition-transform duration-300"
              :title="$t('manage.backgrounds.addToWaitingList')"
              @click="store.addToWaitingList(item)"
            />
            <UButton
              icon="i-heroicons-trash"
              color="error"
              variant="solid"
              size="xl"
              class="shadow-2xl scale-90 sm:scale-75 group-hover:scale-100 transition-transform duration-300"
              @click="deleteMedia(item)"
            />
          </div>

          <!-- Type Badge -->
          <div
            class="absolute top-4 left-4 px-3 py-1 bg-(--ui-bg)/60 text-[10px] font-bold uppercase tracking-widest text-default/80 border border-default"
          >
            {{
              isLocal(item.url)
                ? $t("manage.backgrounds.local")
                : $t("manage.backgrounds.external")
            }}
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from "vue";
import { useConfigStore } from "~~/stores/config";
import type { BackgroundItem } from "~~/app/types/config";

const { t } = useI18n();
const toast = useToast();

const store = useConfigStore();
const allBackgrounds = ref<BackgroundItem[]>([]);

const fetchAllBackgrounds = async () => {
  try {
    const data = await $fetch<BackgroundItem[]>("/api/backgrounds");
    if (Array.isArray(data)) {
      allBackgrounds.value = data;
    }
  } catch (err) {
    console.error("Error fetching backgrounds:", err);
  }
};

onMounted(() => {
  store.startStatusPolling();
  fetchAllBackgrounds();
});

onUnmounted(() => {
  store.stopStatusPolling();
});
const isUploading = ref(false);
const isDragging = ref(false);
const uploadProgress = ref(0);
const fileInput = ref<HTMLInputElement | null>(null);

const newExternal = reactive({
  url: "",
  type: "image" as "image" | "video",
});

const triggerFileInput = () => {
  fileInput.value?.click();
};

const isLocal = (url: string) => url.startsWith("/backgrounds/");

const handleFileUpload = async (event: Event | FileList) => {
  let files: FileList | null = null;
  if (event instanceof Event) {
    const target = event.target as HTMLInputElement;
    files = target.files;
  } else {
    files = event;
  }

  if (!files?.length) return;

  isUploading.value = true;
  uploadProgress.value = 0;

  const formData = new FormData();
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (file) formData.append("files", file);
  }

  try {
    // Use XMLHttpRequest for progress tracking
    await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/backgrounds");

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          uploadProgress.value = Math.round((event.loaded / event.total) * 100);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(xhr.response);
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error("Network error during upload"));
      xhr.send(formData);
    });

    await store.fetchConfig();
    await fetchAllBackgrounds();
    toast.add({
      title: t("manage.backgrounds.uploadSuccess"),
      color: "success",
      icon: "i-heroicons-check-circle",
    });
  } catch (error) {
    console.error("Upload failed:", error);
    toast.add({
      title: t("manage.backgrounds.uploadError"),
      color: "error",
      icon: "i-heroicons-x-circle",
    });
  } finally {
    isUploading.value = false;
    uploadProgress.value = 0;
    if (fileInput.value) fileInput.value.value = "";
  }
};

const handleDrop = (event: DragEvent) => {
  isDragging.value = false;
  const files = event.dataTransfer?.files;
  if (files) {
    handleFileUpload(files);
  }
};

const addExternalUrl = async () => {
  if (!newExternal.url || !store.config) return;

  store.config.background.externalMediaUrlList.push({ ...newExternal });
  newExternal.url = "";
  newExternal.type = "image";

  try {
    await store.saveConfig();
    await fetchAllBackgrounds();
  } catch (error) {
    console.error("Failed to save external URL:", error);
  }
};

const downloadZip = () => {
  window.location.href = "/api/export-backgrounds";
};

const deleteMedia = async (item: any) => {
  if (!confirm(t("manage.backgrounds.deleteConfirm"))) return;

  if (isLocal(item.url)) {
    // Delete local file
    const filename = item.url.replace("/backgrounds/", "");
    try {
      await $fetch(`/api/backgrounds?filename=${filename}`, {
        method: "DELETE",
      });
      await store.fetchConfig();
      await fetchAllBackgrounds();
    } catch (error) {
      console.error("Failed to delete local file:", error);
    }
  } else {
    // Remove external URL
    if (!store.config) return;
    const index = store.config.background.externalMediaUrlList.findIndex(
      (m: any) => m.url === item.url,
    );
    if (index !== -1) {
      store.config.background.externalMediaUrlList.splice(index, 1);
      try {
        await store.saveConfig();
        await fetchAllBackgrounds();
      } catch (error) {
        console.error("Failed to remove external URL:", error);
      }
    }
  }
};
</script>

<style scoped>
.glass-module {
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
}
</style>
