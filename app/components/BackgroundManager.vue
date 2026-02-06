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
    </template>

    <!-- Add Section -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
      <!-- Local Upload -->
      <div class="space-y-4">
        <div class="flex flex-col sm:flex-row gap-4">
          <UFormField :label="$t('manage.backgrounds.uploadTo')" class="flex-1">
            <USelect
              v-model="selectedUploadFolder"
              :items="availableFolders"
              size="xl"
              class="w-full"
            />
          </UFormField>
          <UFormField
            :label="$t('manage.backgrounds.newFolder')"
            class="flex-1"
          >
            <UInput
              v-model="newFolderName"
              placeholder="e.g. Urlaub 2024"
              size="xl"
              class="w-full"
            />
          </UFormField>
        </div>

        <div
          class="border-2 border-dashed p-10 text-center transition-all cursor-pointer group flex flex-col justify-center items-center relative overflow-hidden h-64"
          :class="[
            isDragging
              ? 'border-primary-500 bg-primary-500/10'
              : 'border-default hover:border-primary-500/50 hover:bg-primary-500/5',
          ]"
          @click="triggerFileInput"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
        >
          <div
            class="w-16 h-16 bg-default/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
            :class="{ 'scale-110': isDragging }"
          >
            <UIcon
              :name="isDragging ? 'i-lucide-download' : 'i-lucide-upload'"
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
          <p class="text-sm text-default/40 mb-2">
            {{ $t("manage.backgrounds.uploadSubtitle") }}
          </p>
          <div
            class="text-[10px] uppercase tracking-widest font-black text-primary-500 bg-primary-500/10 px-3 py-1 rounded-full"
          >
            {{ $t("manage.backgrounds.uploadTo") }}:
            {{ newFolderName || selectedUploadFolder }}
          </div>
          <input
            ref="fileInput"
            type="file"
            class="hidden"
            accept="image/*,video/*"
            multiple
            @change="handleFileUpload"
          />
        </div>
      </div>

      <!-- External URL -->
      <UCard
        :ui="{ body: 'p-10' }"
        class="bg-default/5 shadow-none border border-default"
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
                icon="i-lucide-plus"
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
    <div class="mb-12 space-y-4">
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
            class="relative flex-shrink-0 w-32 sm:w-40 aspect-video overflow-hidden border border-default bg-default/40 group"
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
          class="flex-shrink-0 w-32 sm:w-40 aspect-video flex flex-col items-center justify-center border border-dashed border-default/30 bg-default/5 opacity-50 rounded-xs"
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

    <!-- Status Messages (Legacy, removed in favor of overlay) -->

    <!-- Folder Selection Settings -->
    <div
      v-if="store.config"
      class="mb-12 p-6 bg-default/5 border border-default rounded-lg"
    >
      <div class="flex items-center space-x-3 mb-6">
        <UIcon name="i-lucide-folder-open" class="w-6 h-6 text-primary-500" />
        <h3 class="text-xl font-bold text-default">
          {{ $t("manage.backgrounds.selectFolders") }}
        </h3>
      </div>

      <div class="space-y-6">
        <URadioGroup
          v-model="store.config.background.useAllFolders"
          :items="[
            { label: $t('manage.backgrounds.allFolders'), value: true },
            { label: $t('manage.backgrounds.distinctFolders'), value: false },
          ]"
          @change="store.saveConfig"
        />

        <div
          v-if="store.config.background.useAllFolders === false"
          class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 pl-6 border-l-2 border-primary-500/20"
        >
          <div
            v-for="folder in availableFolders"
            :key="folder"
            class="flex items-center space-x-2"
          >
            <UCheckbox
              :label="folder"
              :model-value="
                store.config.background.enabledFolders?.includes(folder)
              "
              @update:model-value="
                (val) => {
                  if (!store.config) return;
                  if (!store.config.background.enabledFolders)
                    store.config.background.enabledFolders = [];
                  if (val) {
                    store.config.background.enabledFolders.push(folder);
                  } else {
                    store.config.background.enabledFolders =
                      store.config.background.enabledFolders.filter(
                        (f) => f !== folder,
                      );
                  }
                  store.saveConfig();
                }
              "
            />
          </div>
        </div>

        <!-- External Media Selection -->
        <div
          v-if="
            store.config.background.useAllFolders === false &&
            externalBackgrounds.length > 0
          "
          class="space-y-4 pt-6 border-t border-default/10"
        >
          <div class="flex items-center space-x-2 text-default/50">
            <UIcon name="i-lucide-link" class="w-4 h-4" />
            <span class="text-xs font-bold uppercase tracking-widest">{{
              $t("manage.backgrounds.external")
            }}</span>
          </div>
          <div
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pl-6 border-l-2 border-primary-500/20"
          >
            <div
              v-for="item in externalBackgrounds"
              :key="item.url"
              class="flex items-center space-x-3 p-2 bg-default/5 border border-default rounded-lg hover:border-primary-500/30 transition-colors"
            >
              <UCheckbox
                :model-value="
                  store.config.background.enabledExternalUrls?.includes(
                    item.url,
                  )
                "
                @update:model-value="
                  (val) => {
                    if (!store.config) return;
                    if (!store.config.background.enabledExternalUrls)
                      store.config.background.enabledExternalUrls = [];
                    if (val) {
                      store.config.background.enabledExternalUrls.push(
                        item.url,
                      );
                    } else {
                      store.config.background.enabledExternalUrls =
                        store.config.background.enabledExternalUrls.filter(
                          (u) => u !== item.url,
                        );
                    }
                    store.saveConfig();
                  }
                "
              />
              <div class="flex items-center space-x-2 truncate flex-1">
                <img
                  v-if="item.type === 'image'"
                  :src="item.url"
                  class="w-8 h-8 object-cover rounded shadow-sm"
                />
                <UIcon
                  v-else
                  name="i-lucide-video"
                  class="w-5 h-5 text-default/40"
                />
                <span class="text-xs truncate text-default">{{
                  item.url.split("/").pop() || item.url
                }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Media Gallery -->
    <div class="space-y-8">
      <div
        class="flex flex-col md:flex-row md:items-center justify-between border-b border-default pb-6 gap-6"
      >
        <div class="space-y-4">
          <h3 class="text-xl font-bold text-default">
            {{ $t("manage.backgrounds.gallery") }}
          </h3>
          <!-- Browser / Breadcrumbs -->
          <div class="flex items-center space-x-2">
            <UButton
              icon="i-lucide-home"
              color="neutral"
              variant="subtle"
              size="xs"
              @click="currentGalleryFolder = null"
            />
            <UIcon
              v-if="currentGalleryFolder"
              name="i-heroicons-chevron-right"
              class="w-4 h-4 text-default/30"
            />
            <UBadge
              v-if="currentGalleryFolder"
              :label="
                currentGalleryFolder === 'external'
                  ? $t('manage.backgrounds.external')
                  : currentGalleryFolder
              "
              color="primary"
              variant="subtle"
              size="sm"
              class="capitalize"
            />
          </div>
        </div>
        <div class="flex flex-col sm:flex-row sm:items-center gap-4">
          <UButton
            icon="i-lucide-archive"
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
                count: displayedMedia.length,
              })
            "
            color="neutral"
            variant="subtle"
            size="lg"
            class="w-full sm:w-auto justify-center"
          />
        </div>
      </div>

      <!-- Folder View / Gallery Grid -->
      <div
        v-if="currentGalleryFolder === null"
        class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
      >
        <!-- Folder Cards -->
        <div
          v-for="folder in galleryFolders"
          :key="folder"
          class="relative aspect-square bg-default/5 border border-default hover:border-primary-500/50 hover:bg-primary-500/5 transition-all cursor-pointer group flex flex-col items-center justify-center space-y-3"
          @click="currentGalleryFolder = folder"
        >
          <div
            class="w-12 h-12 bg-default/5 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"
          >
            <UIcon
              :name="
                folder === 'external' ? 'i-lucide-globe' : 'i-lucide-folder'
              "
              class="w-6 h-6 text-primary-500"
            />
          </div>
          <div class="text-center px-4">
            <p class="text-sm font-bold text-default truncate capitalize">
              {{
                folder === "external"
                  ? $t("manage.backgrounds.external")
                  : folder
              }}
            </p>
            <p class="text-[10px] text-default/40 uppercase tracking-widest">
              {{ getFolderItemCount(folder) }}
              {{
                $t("manage.backgrounds.items", { count: "" }).replace("{}", "")
              }}
            </p>
          </div>

          <!-- Folder Actions -->
          <div
            v-if="folder !== 'external'"
            class="absolute top-2 right-2 opacity-40 group-hover:opacity-100 transition-opacity"
          >
            <UButton
              icon="i-lucide-pencil"
              color="neutral"
              variant="soft"
              size="xs"
              @click.stop="openRenameModal(folder)"
            />
          </div>
        </div>
      </div>

      <div
        v-if="
          displayedMedia.length === 0 &&
          (currentGalleryFolder !== null || galleryFolders.length === 0)
        "
        class="text-center py-20 bg-default/5 border border-default"
      >
        <UIcon
          name="i-lucide-image"
          class="w-16 h-16 mx-auto mb-4 opacity-10"
        />
        <p class="text-default/30 text-lg">
          {{ $t("manage.backgrounds.noBackgrounds") }}
        </p>
      </div>

      <div
        v-if="displayedMedia.length > 0"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        <div
          v-for="(item, index) in displayedMedia"
          :key="item.url"
          class="relative group aspect-video overflow-hidden border border-default bg-default/40 shadow-xl"
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
            class="absolute inset-0 sm:bg-default/60 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-4"
          >
            <UButton
              icon="i-lucide-clock"
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
            class="absolute top-4 left-4 px-3 py-1 bg-default/60 text-[10px] font-bold uppercase tracking-widest text-default/80 border border-default"
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

    <!-- Upload Progress Modal -->
    <UModal
      v-model="showUploadModal"
      :title="$t('manage.backgrounds.uploadQueue')"
      class="max-w-2xl"
    >
      <template #body>
        <div class="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          <div
            v-for="item in uploadQueue"
            :key="item.id"
            class="flex flex-col p-4 bg-default/5 border border-default rounded-lg"
          >
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center space-x-3 truncate">
                <UIcon
                  :name="
                    item.file.type.startsWith('video')
                      ? 'i-lucide-video'
                      : 'i-lucide-image'
                  "
                  class="w-5 h-5 text-default/40 shrink-0"
                />
                <span class="text-sm font-bold truncate">{{
                  item.file.name
                }}</span>
              </div>
              <div class="flex items-center space-x-2 shrink-0">
                <span
                  class="text-[10px] font-black uppercase tracking-wider"
                  :class="{
                    'text-primary-500': item.status === 'uploading',
                    'text-success-500': item.status === 'success',
                    'text-error-500': item.status === 'error',
                    'text-default/30': item.status === 'pending',
                  }"
                >
                  {{ $t(`manage.backgrounds.status.${item.status}`) }}
                </span>
                <UIcon
                  v-if="item.status === 'success'"
                  name="i-lucide-check-circle"
                  class="w-5 h-5 text-success-500"
                />
                <UIcon
                  v-else-if="item.status === 'error'"
                  name="i-lucide-alert-circle"
                  class="w-5 h-5 text-error-500"
                />
                <UIcon
                  v-else-if="item.status === 'uploading'"
                  name="i-lucide-refresh-cw"
                  class="w-5 h-5 text-primary-500 animate-spin"
                />
              </div>
            </div>
            <UProgress
              v-if="item.status === 'uploading' || item.progress > 0"
              v-model="item.progress"
              size="xs"
              :color="
                item.status === 'error'
                  ? 'error'
                  : item.status === 'success'
                    ? 'success'
                    : 'primary'
              "
            />
            <p v-if="item.error" class="text-[10px] text-error-500 mt-1">
              {{ item.error }}
            </p>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton
            v-if="!isUploading"
            :label="$t('common.cancel')"
            variant="ghost"
            color="neutral"
            @click="
              showUploadModal = false;
              uploadQueue = [];
            "
          />
          <UButton
            v-if="!isUploading && uploadQueue.length > 0"
            :label="$t('common.saved')"
            color="primary"
            @click="
              showUploadModal = false;
              uploadQueue = [];
            "
          />
        </div>
      </template>
    </UModal>

    <!-- Rename Folder Modal -->
    <UModal
      v-model:open="showRenameModal"
      :title="$t('manage.backgrounds.renameFolder')"
    >
      <UButton v-show="false" label="Hidden Trigger" />

      <template #body>
        <UFormField :label="$t('manage.backgrounds.newName')">
          <UInput
            v-model="renameValue"
            :placeholder="folderToRename"
            class="w-full"
            autofocus
            @keyup.enter="renameFolder"
          />
        </UFormField>
      </template>

      <template #footer="{ close }">
        <div class="flex justify-end gap-3 w-full">
          <UButton
            :label="$t('common.cancel')"
            color="neutral"
            variant="ghost"
            @click="close"
          />
          <UButton
            :label="$t('common.save')"
            color="primary"
            :loading="isRenaming"
            @click="renameFolder"
          />
        </div>
      </template>
    </UModal>
  </UCard>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed } from "vue";
import { useConfigStore } from "~~/stores/config";
import type { BackgroundItem } from "~~/app/types/config";

const { t } = useI18n();
const toast = useToast();

const store = useConfigStore();
const allBackgrounds = ref<BackgroundItem[]>([]);
const availableFolders = ref<string[]>([]);
const isUploading = ref(false);
const isDragging = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

interface UploadItem {
  id: string;
  file: File;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  error?: string;
}

const uploadQueue = ref<UploadItem[]>([]);
const showUploadModal = ref(false);
const selectedUploadFolder = ref("root");
const newFolderName = ref("");

const showRenameModal = ref(false);
const folderToRename = ref("");
const renameValue = ref("");
const isRenaming = ref(false);

const openRenameModal = (folder: string) => {
  folderToRename.value = folder;
  renameValue.value = folder;
  showRenameModal.value = true;
};

const renameFolder = async () => {
  if (!renameValue.value || renameValue.value === folderToRename.value) {
    showRenameModal.value = false;
    return;
  }

  isRenaming.value = true;
  try {
    const response = await $fetch<{ success: boolean; message: string }>(
      "/api/backgrounds/folders",
      {
        method: "PUT",
        body: { oldName: folderToRename.value, newName: renameValue.value },
      },
    );

    if (response.success) {
      toast.add({
        title: t("manage.backgrounds.renameSuccess"),
        color: "success",
      });

      // Update config if folder was enabled
      if (store.config?.background.enabledFolders) {
        const index = store.config.background.enabledFolders.indexOf(
          folderToRename.value,
        );
        if (index !== -1) {
          store.config.background.enabledFolders[index] = renameValue.value;
          store.saveConfig();
        }
      }

      await fetchAllBackgrounds();
      await fetchFolders();
    }
  } catch (err: any) {
    toast.add({
      title: t("manage.backgrounds.renameError"),
      description: err.statusMessage || err.message,
      color: "error",
    });
  } finally {
    isRenaming.value = false;
    showRenameModal.value = false;
  }
};

const currentGalleryFolder = ref<string | null>(null);

const galleryFolders = computed(() => {
  // Only show folders if we are at root
  if (currentGalleryFolder.value !== null) return [];

  // Get unique folders from all backgrounds, excluding "root" for now as we show files in /
  const folders = new Set<string>();
  allBackgrounds.value.forEach((item) => {
    if (item.url.startsWith("http")) {
      folders.add("external");
    } else if (item.folder && item.folder !== "root") {
      folders.add(item.folder);
    }
  });
  return Array.from(folders).sort();
});

const displayedMedia = computed(() => {
  if (currentGalleryFolder.value === "external") {
    return allBackgrounds.value.filter((item) => item.url.startsWith("http"));
  }

  const target = currentGalleryFolder.value || "root";
  return allBackgrounds.value.filter(
    (item) => !item.url.startsWith("http") && item.folder === target,
  );
});

const getFolderItemCount = (folder: string) => {
  if (folder === "external")
    return allBackgrounds.value.filter((item) => item.url.startsWith("http"))
      .length;
  return allBackgrounds.value.filter((item) => item.folder === folder).length;
};

const externalBackgrounds = computed(() => {
  return allBackgrounds.value.filter((item) => item.url.startsWith("http"));
});

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

const fetchFolders = async () => {
  try {
    const data = await $fetch<string[]>("/api/backgrounds/folders");
    if (Array.isArray(data)) {
      availableFolders.value = data;
    }
  } catch (err) {
    console.error("Error fetching folders:", err);
  }
};

onMounted(() => {
  store.startStatusPolling();
  fetchAllBackgrounds();
  fetchFolders();
});

onUnmounted(() => {
  store.stopStatusPolling();
});

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

  // Initialize queue
  const newItems: UploadItem[] = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (file) {
      newItems.push({
        id: Math.random().toString(36).substr(2, 9),
        file,
        status: "pending",
        progress: 0,
      });
    }
  }

  uploadQueue.value = [...uploadQueue.value, ...newItems];
  showUploadModal.value = true;
  processQueue();
};

const processQueue = async () => {
  if (isUploading.value) return;

  const pending = uploadQueue.value.find((item) => item.status === "pending");
  if (!pending) {
    if (uploadQueue.value.some((i) => i.status === "success")) {
      await store.fetchConfig();
      await fetchAllBackgrounds();
      await fetchFolders();
    }
    return;
  }

  isUploading.value = true;
  pending.status = "uploading";

  const formData = new FormData();
  formData.append("files", pending.file);
  formData.append("folder", newFolderName.value || selectedUploadFolder.value);

  try {
    await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/backgrounds");

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          pending.progress = Math.round((event.loaded / event.total) * 100);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(xhr.response);
        } else {
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error("Network error"));
      xhr.send(formData);
    });

    pending.status = "success";
    pending.progress = 100;
  } catch (error: any) {
    pending.status = "error";
    pending.error = error.message || "Unknown error";
  } finally {
    isUploading.value = false;
    newFolderName.value = ""; // Clear new folder name after first upload if multiple
    processQueue();
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
      await fetchFolders();
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
