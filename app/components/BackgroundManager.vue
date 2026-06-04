<template>
  <UCard variant="glassDark" class="border-0! shadow-none! overflow-hidden">
    <!-- Controls Section (Settings, Waitlist, Header) -->
    <MediaControls :available-folders="availableFolders" class="mb-12" />

    <!-- Upload Section -->
    <MediaUpload :current-folder="currentGalleryFolder" @success="refreshGallery" class="mb-8" />

    <!-- Gallery Section -->
    <MediaGallery :media="displayedMedia" :folders="galleryFolders" :all-backgrounds="allBackgrounds"
      :breadcrumb-parts="breadcrumbParts" :current-folder="currentGalleryFolder" :is-loading="isLoadingMedia"
      @navigate="navigateToFolder" @delete-folder="deleteFolder" @delete-media="deleteMedia"
      @create-folder="handleCreateFolder" @rename-folder="handleRenameFolder" @download="downloadZip" />
  </UCard>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import { useConfigStore } from "~/stores/config";
import { useRoute, useRouter } from "vue-router";
import type { BackgroundItem } from "~~/app/types/config";

// Components
import MediaControls from "./background/MediaControls.vue";
import MediaUpload from "./background/MediaUpload.vue";
import MediaGallery from "./background/MediaGallery.vue";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const toast = useToast();
const store = useConfigStore();

const allBackgrounds = ref<BackgroundItem[]>([]);
const isLoadingMedia = ref(true);
const currentGalleryFolder = ref<string | null>((route.query.folder as string) || null);

// --- State Management ---
// Using backend /api/media routes
const { token } = useDirectusToken();


interface DirectusFolder {
  id: string;
  name: string;
  parent: string | null;
}

const availableFolders = ref<DirectusFolder[]>([]);

const fetchAllBackgrounds = async () => {
  try {
    const data = await $fetch<BackgroundItem[]>('/api/media/files', {
      headers: { Authorization: `Bearer ${token.value}` }
    });
    allBackgrounds.value = data;
  } catch (err) {
    console.error("Error fetching backgrounds from server:", err);
  }
};

const fetchFolders = async () => {
  try {
    const folders = await $fetch<any[]>('/api/media/folders', {
      headers: { Authorization: `Bearer ${token.value}` }
    });
    // Inject virtual root folder for selection settings
    availableFolders.value = [{ id: 'root', name: 'Root', parent: null }, ...folders];
  } catch (err) {
    console.error("Error fetching folders:", err);
  }
};

const refreshGallery = async () => {
  isLoadingMedia.value = true;
  const startTime = Date.now();
  try {
    await Promise.all([fetchAllBackgrounds(), fetchFolders()]);
  } finally {
    const elapsed = Date.now() - startTime;
    const minDelay = 400;
    if (elapsed < minDelay) await new Promise(r => setTimeout(r, minDelay - elapsed));
    isLoadingMedia.value = false;
  }
};

// --- Watchers & Lifecycle ---

watch(() => route.query.folder, async (newFolder) => {
  currentGalleryFolder.value = (newFolder as string) || null;
  await refreshGallery();
});

onMounted(() => {
  store.startStatusPolling();
  refreshGallery();
});

onUnmounted(() => {
  store.stopStatusPolling();
});

// --- Computed ---

const galleryFolders = computed(() => {
  const currentId = currentGalleryFolder.value && currentGalleryFolder.value !== "root" ? currentGalleryFolder.value : null;
  return availableFolders.value.filter(f => {
    if (currentId === null) return !f.parent;
    return f.parent === currentId;
  }).sort((a, b) => a.name.localeCompare(b.name));
});

const breadcrumbParts = computed(() => {
  if (!currentGalleryFolder.value || currentGalleryFolder.value === "root") return [];

  const parts: { label: string; path: string }[] = [];
  let currentId: string | null = currentGalleryFolder.value;

  while (currentId) {
    const folder = availableFolders.value.find(f => f.id === currentId);
    if (!folder) break;
    parts.unshift({ label: folder.name, path: folder.id });
    currentId = typeof folder.parent === 'string' ? folder.parent : (folder.parent as any)?.id || null;
  }

  return parts;
});

const displayedMedia = computed(() => {
  const target = currentGalleryFolder.value || "root";
  return allBackgrounds.value.filter((item) => item.folder === target);
});

// --- Handlers ---

const navigateToFolder = (path: string | null) => {
  router.push({ query: { ...route.query, folder: path || undefined } });
};

const handleCreateFolder = async (name: string) => {
  try {
    const parentId = currentGalleryFolder.value && currentGalleryFolder.value !== "root" ? currentGalleryFolder.value : null;
    const res = await $fetch<any>('/api/media/folders', {
      method: "POST",
      headers: { Authorization: `Bearer ${token.value}` },
      body: { name, parent: parentId }
    });

    if (res && res.id) {
      toast.add({ title: t("common.success"), color: "success" });
      await refreshGallery();
      navigateToFolder(res.id);
    } else {
      throw new Error("Failed to create folder");
    }
  } catch (err: any) {
    toast.add({ title: t("common.error"), description: err.statusMessage || err.message, color: "error" });
  }
};

const handleRenameFolder = async (id: string, newName: string) => {
  if (!newName) return;
  try {
    const res = await $fetch<any>(`/api/media/folders/${id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token.value}` },
      body: { name: newName },
    });
    if (res) {
      toast.add({ title: t("manage.backgrounds.renameSuccess"), color: "success" });
      await refreshGallery();
    } else {
      throw new Error("Failed to rename folder");
    }
  } catch (err: any) {
    toast.add({ title: t("manage.backgrounds.renameError"), description: err.statusMessage || err.message, color: "error" });
  }
};

const deleteFolder = async (folderId: string) => {
  if (!confirm(t("manage.backgrounds.deleteFolderConfirm", { folder: folderId }))) return;
  try {
    await $fetch(`/api/media/folders/${folderId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token.value}` }
    });
    toast.add({ title: t("common.success"), color: "success" });
    await refreshGallery();
    navigateToFolder(null);
  } catch (err: any) {
    toast.add({ title: t("common.error"), description: err.statusMessage || err.message, color: "error" });
  }
};

const deleteMedia = async (item: BackgroundItem) => {
  if (!confirm(t("manage.backgrounds.deleteConfirm"))) return;
  if (!item.id) return;
  try {
    await $fetch(`/api/media/files/${item.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token.value}` }
    });
    await refreshGallery();
  } catch (error) {
    console.error("Failed to delete directus file:", error);
  }
};

const downloadZip = () => {
  alert("Folder download is managed via Directus UI now.");
};
</script>
