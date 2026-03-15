<template>
  <div class="space-y-8">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-6 border-b border-default/30">
      <!-- Breadcrumb & Item Count -->
      <div class="flex items-center space-x-4">
        <div class="flex items-center gap-1 bg-default/5 p-1 rounded-lg">
          <UButton icon="i-lucide-home" color="neutral" variant="ghost" size="sm" class="shrink-0"
            @click="emit('navigate', null)" />
          <template v-for="(part, index) in breadcrumbParts" :key="part.path">
            <UIcon name="i-lucide-chevron-right" class="w-4 h-4 text-default/20" />
            <UButton :label="part.label" size="sm" variant="ghost" class="shrink-0 capitalize"
              @click="emit('navigate', part.path)" />
          </template>
        </div>
        <div
          class="hidden sm:flex items-center space-x-2 text-[10px] text-default/40 uppercase tracking-widest font-black">
          <UIcon name="i-lucide-database" class="w-3 h-3" />
          <span>{{ media.length }} {{ $t("manage.backgrounds.items", {
            count: media.length
          }).replace(media.length.toString(),
            "").trim() }}</span>
        </div>
      </div>

      <!-- Toolbar Actions -->
      <div class="flex items-center gap-2">
        <UButton v-if="!isSharedView && currentFolder" icon="i-lucide-share-2" :label="$t('common.share')"
          color="primary" variant="subtle" size="sm" @click="copyShareLink" />
        <UButton icon="i-lucide-download" :label="$t('common.download')" color="neutral" variant="subtle" size="sm"
          @click="emit('download')" />
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="isLoading"
      class="flex flex-col items-center justify-center py-20 bg-default/5 border border-default rounded-xl space-y-4">
      <UIcon name="i-lucide-loader-2" class="w-12 h-12 text-primary-500 animate-spin" />
      <p class="text-default/40 font-bold uppercase tracking-widest text-xs">
        {{ $t("common.loading") }}
      </p>
    </div>

    <!-- Folder View / Gallery Grid -->
    <div v-else class="space-y-12 animate-in fade-in duration-500">
      <div v-if="folders.length > 0 || !isSharedView"
        class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        <!-- Create Folder Action Card -->
        <div v-if="!isSharedView"
          class="relative aspect-square border-2 border-dashed border-primary-500/30 hover:border-primary-500/60 hover:bg-primary-500/5 transition-all cursor-pointer flex flex-col items-center justify-center space-y-3"
          @click="openCreateFolderModal">
          <div
            class="w-12 h-12 bg-primary-500/10 rounded-full flex items-center justify-center transition-transform hover:scale-110">
            <UIcon name="i-lucide-folder-plus" class="w-6 h-6 text-primary-500" />
          </div>
          <p class="text-sm font-bold text-primary-500 text-center">
            {{ $t("manage.backgrounds.newFolder") }}
          </p>
        </div>

        <!-- Folder Cards -->
        <div v-for="folder in folders" :key="folder"
          class="relative aspect-square bg-default/5 border border-default hover:border-primary-500/50 hover:bg-primary-500/5 transition-all cursor-pointer group flex flex-col items-center justify-center space-y-3"
          @click="emit('navigate', folder)">
          <div
            class="w-12 h-12 bg-default/5 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <UIcon name="i-lucide-folder" class="w-6 h-6 text-primary-500" />
          </div>
          <div class="text-center px-4 overflow-hidden w-full">
            <p class="text-sm font-bold text-default truncate capitalize">
              {{ folder.split("/").pop() }}
            </p>
            <p class="text-[10px] text-default/40 uppercase tracking-widest">
              {{ getFolderItemCount(folder) }}
              {{ $t("manage.backgrounds.items", { count: "" }).replace("{}", "") }}
            </p>
          </div>

          <!-- Folder Actions -->
          <div v-if="!isSharedView"
            class="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <UButton icon="i-lucide-pencil" color="neutral" variant="soft" size="xs"
              @click.stop="openRenameModal(folder)" />
            <UButton icon="i-lucide-trash-2" color="error" variant="soft" size="xs"
              @click.stop="emit('deleteFolder', folder)" />
          </div>
        </div>
      </div>

      <!-- Media Items Grid -->
      <div v-if="media.length === 0" class="text-center py-20 bg-default/5 border border-default rounded-xl">
        <UIcon name="i-lucide-image" class="w-16 h-16 mx-auto mb-4 opacity-10" />
        <p class="text-default/30 text-lg">{{ $t("manage.backgrounds.noBackgrounds") }}</p>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div v-for="item in media" :key="item.url"
          class="relative group aspect-video overflow-hidden border border-default bg-default/40 shadow-xl">
          <!-- Preview -->
          <img v-if="item.type === 'image'" :src="item.url"
            class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
          <video v-else :src="item.url" class="w-full h-full object-cover" muted />

          <!-- Overlay Actions -->
          <div
            class="absolute inset-0 sm:bg-default/60 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-4">
            <UButton v-if="!isSharedView" icon="i-lucide-clock" color="primary" variant="solid" size="xl"
              class="shadow-2xl scale-90 sm:scale-75 group-hover:scale-100 transition-transform duration-300"
              :title="$t('manage.backgrounds.addToWaitingList')" @click="store.addToWaitingList(item)" />
            <UButton v-if="!isSharedView" icon="i-heroicons-trash" color="error" variant="solid" size="xl"
              class="shadow-2xl scale-90 sm:scale-75 group-hover:scale-100 transition-transform duration-300"
              @click="emit('deleteMedia', item)" />
            <UButton v-if="isSharedView" icon="i-lucide-eye" color="primary" variant="solid" size="xl"
              class="shadow-2xl" @click="openLightbox(item)" />
          </div>

          <!-- Type Badge -->
          <div
            class="absolute top-4 left-4 px-3 py-1 bg-default/60 text-[10px] font-bold uppercase tracking-widest text-default/80 border border-default flex items-center gap-1.5">
            <UIcon :name="item.type === 'image' ? 'i-lucide-image' : 'i-lucide-video'" class="w-3 h-3" />
            {{ item.type === 'image' ? 'Image' : 'Video' }}
          </div>
        </div>
      </div>
    </div>

    <!-- Rename Folder Modal -->
    <UModal v-model:open="showRenameModal" :title="$t('manage.backgrounds.renameFolder')">
      <template #body>
        <UFormField :label="$t('manage.backgrounds.newName')">
          <UInput v-model="renameValue" :placeholder="folderToRename" class="w-full" autofocus
            @keyup.enter="handleRename" />
        </UFormField>
      </template>
      <template #footer="{ close }">
        <div class="flex justify-end gap-3 w-full">
          <UButton :label="$t('common.cancel')" color="neutral" variant="ghost" @click="close" />
          <UButton :label="$t('common.save')" color="primary" :loading="isRenaming" @click="handleRename" />
        </div>
      </template>
    </UModal>

    <!-- Create Folder Modal -->
    <UModal v-model:open="showCreateFolderModal" :title="$t('manage.backgrounds.newFolder')">
      <template #body>
        <UFormField :label="$t('manage.backgrounds.folderName')">
          <UInput v-model="newFolderNameInput" placeholder="e.g. My Trip" class="w-full" autofocus
            @keyup.enter="handleCreate" />
        </UFormField>
      </template>
      <template #footer="{ close }">
        <div class="flex justify-end gap-3 w-full">
          <UButton :label="$t('common.cancel')" color="neutral" variant="ghost" @click="close" />
          <UButton :label="$t('common.create')" color="primary" :loading="isCreatingFolder" @click="handleCreate" />
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useConfigStore } from "~~/stores/config";
import type { BackgroundItem } from "~~/app/types/config";

const props = defineProps<{
  media: BackgroundItem[];
  folders: string[];
  currentFolder: string | null;
  isLoading: boolean;
  isSharedView?: boolean;
  allBackgrounds?: BackgroundItem[]; // Needed for folder counts if not in media
}>();

const emit = defineEmits<{
  (e: 'navigate', path: string | null): void;
  (e: 'deleteFolder', folder: string): void;
  (e: 'deleteMedia', item: BackgroundItem): void;
  (e: 'createFolder', name: string): void;
  (e: 'renameFolder', oldName: string, newName: string): void;
  (e: 'download'): void;
}>();

const store = useConfigStore();
const toast = useToast();

const showRenameModal = ref(false);
const folderToRename = ref("");
const renameValue = ref("");
const isRenaming = ref(false);

const showCreateFolderModal = ref(false);
const newFolderNameInput = ref("");
const isCreatingFolder = ref(false);

const breadcrumbParts = computed(() => {
  if (!props.currentFolder) return [];
  const parts = props.currentFolder.split("/");
  let currentPath = "";
  return parts.map(part => {
    currentPath = currentPath ? `${currentPath}/${part}` : part;
    return { label: part, path: currentPath };
  });
});

const getFolderItemCount = (folder: string) => {
  const source = props.allBackgrounds || props.media;
  return source.filter((item) => {
    return item.folder === folder || item.folder?.startsWith(folder + "/");
  }).length;
};

const openRenameModal = (folder: string) => {
  folderToRename.value = folder;
  renameValue.value = folder;
  showRenameModal.value = true;
};

const handleRename = async () => {
  emit('renameFolder', folderToRename.value, renameValue.value);
  showRenameModal.value = false;
};

const openCreateFolderModal = () => {
  newFolderNameInput.value = "";
  showCreateFolderModal.value = true;
};

const handleCreate = async () => {
  emit('createFolder', newFolderNameInput.value);
  showCreateFolderModal.value = false;
};

const copyShareLink = async () => {
  if (!props.currentFolder) return;
  const url = new URL(window.location.origin);
  url.pathname = `/share/${props.currentFolder}`;
  const text = url.toString();

  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback for non-HTTPS contexts
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    toast.add({ title: "Share link copied!", color: "success", icon: "i-lucide-copy" });
  } catch {
    toast.add({ title: "Failed to copy link", color: "error", icon: "i-lucide-alert-circle" });
  }
};

const openLightbox = (item: BackgroundItem) => {
  window.open(item.url, '_blank');
};
</script>
