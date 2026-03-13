<template>
  <UCard variant="glassDark" class="border-0! shadow-none! overflow-hidden">
    <!-- Controls Section (Settings, Waitlist, Header) -->
    <MediaControls :available-folders="availableFolders" class="mb-12" />

    <!-- Upload Section -->
    <MediaUpload
      :current-folder="currentGalleryFolder"
      @success="refreshGallery"
      class="mb-8"
    />

    <!-- Gallery Section -->
    <MediaGallery
      :media="displayedMedia"
      :folders="galleryFolders"
      :all-backgrounds="allBackgrounds"
      :current-folder="currentGalleryFolder"
      :is-loading="isLoadingMedia"
      @navigate="navigateToFolder"
      @delete-folder="deleteFolder"
      @delete-media="deleteMedia"
      @create-folder="handleCreateFolder"
      @rename-folder="handleRenameFolder"
      @download="downloadZip"
    />
  </UCard>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import { useConfigStore } from "~~/stores/config";
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
const availableFolders = ref<string[]>([]);
const isLoadingMedia = ref(true);
const currentGalleryFolder = ref<string | null>((route.query.folder as string) || null);

// --- State Management ---

const fetchAllBackgrounds = async () => {
  try {
    const data = await $fetch<BackgroundItem[]>("/api/backgrounds");
    if (Array.isArray(data)) allBackgrounds.value = data;
  } catch (err) {
    console.error("Error fetching backgrounds:", err);
  }
};

const fetchFolders = async () => {
  try {
    const data = await $fetch<string[]>("/api/backgrounds/folders");
    if (Array.isArray(data)) availableFolders.value = data;
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
  const currentDepth = currentGalleryFolder.value ? currentGalleryFolder.value.split("/").length : 0;
  const allFolderPaths = new Set<string>();

  allBackgrounds.value.forEach((item) => {
    if (item.folder && item.folder !== "root") {
      allFolderPaths.add(item.folder);
      const parts = item.folder.split("/");
      let currentPath = "";
      for (let i = 0; i < parts.length - 1; i++) {
        currentPath = currentPath ? `${currentPath}/${parts[i]}` : (parts[i] as string);
        allFolderPaths.add(currentPath);
      }
    }
  });

  availableFolders.value.forEach(folder => {
    if (folder !== "root") allFolderPaths.add(folder);
  });

  return Array.from(allFolderPaths).filter(folder => {
    if (currentGalleryFolder.value === null) return !folder.includes("/");
    if (!folder.startsWith(currentGalleryFolder.value + "/")) return false;
    return folder.split("/").length === currentDepth + 1;
  }).sort();
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
    const response = await $fetch<{ success: boolean }>("/api/backgrounds/folders", {
      method: "POST",
      body: { name, parent: currentGalleryFolder.value || "root" },
    });
    if (response.success) {
      toast.add({ title: t("common.success"), color: "success" });
      await refreshGallery();
      const newPath = currentGalleryFolder.value ? `${currentGalleryFolder.value}/${name}` : name;
      navigateToFolder(newPath);
    }
  } catch (err: any) {
    toast.add({ title: t("common.error"), description: err.message, color: "error" });
  }
};

const handleRenameFolder = async (oldName: string, newName: string) => {
  if (!newName || newName === oldName) return;
  try {
    const response = await $fetch<{ success: boolean }>("/api/backgrounds/folders", {
      method: "PUT",
      body: { oldName, newName },
    });
    if (response.success) {
      toast.add({ title: t("manage.backgrounds.renameSuccess"), color: "success" });
      if (store.config?.background.enabledFolders) {
        const index = store.config.background.enabledFolders.indexOf(oldName);
        if (index !== -1) {
          store.config.background.enabledFolders[index] = newName;
          store.saveConfig();
        }
      }
      await refreshGallery();
    }
  } catch (err: any) {
    toast.add({ title: t("manage.backgrounds.renameError"), description: err.message, color: "error" });
  }
};

const deleteFolder = async (folder: string) => {
  if (!confirm(t("manage.backgrounds.deleteFolderConfirm", { folder }))) return;
  try {
    const response = await $fetch<{ success: boolean }>("/api/backgrounds/folders", {
      method: "DELETE",
      params: { folder }
    });
    if (response.success) {
      toast.add({ title: t("common.success"), color: "success" });
      if (store.config?.background.enabledFolders) {
        store.config.background.enabledFolders = store.config.background.enabledFolders.filter(
          (f: string) => f !== folder && !f.startsWith(folder + "/"),
        );
        await store.saveConfig();
      }
      await refreshGallery();
      if (currentGalleryFolder.value === folder || currentGalleryFolder.value?.startsWith(folder + "/")) {
        const parent = folder.includes("/") ? folder.substring(0, folder.lastIndexOf("/")) : null;
        navigateToFolder(parent);
      }
    }
  } catch (err: any) {
    toast.add({ title: t("common.error"), description: err.message, color: "error" });
  }
};

const deleteMedia = async (item: BackgroundItem) => {
  if (!confirm(t("manage.backgrounds.deleteConfirm"))) return;
  const filename = item.url.replace("/backgrounds/", "");
  try {
    await $fetch(`/api/backgrounds?filename=${filename}`, { method: "DELETE" });
    await store.fetchConfig();
    await refreshGallery();
  } catch (error) {
    console.error("Failed to delete local file:", error);
  }
};

const downloadZip = () => {
  const target = currentGalleryFolder.value || "root";
  window.location.href = `/api/export-backgrounds?folder=${encodeURIComponent(target)}`;
};
</script>
