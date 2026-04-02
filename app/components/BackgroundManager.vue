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
      :breadcrumb-parts="breadcrumbParts"
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
const isLoadingMedia = ref(true);
const currentGalleryFolder = ref<string | null>((route.query.folder as string) || null);

// --- State Management ---

const directusUrl = useDirectusUrl();
const { getFiles, deleteFiles } = useDirectusFiles();
const { token } = useDirectusToken();

interface DirectusFolder {
  id: string;
  name: string;
  parent: string | null;
}

const availableFolders = ref<DirectusFolder[]>([]);

const fetchAllBackgrounds = async () => {
  try {
    const data = await getFiles<any>({ params: { limit: -1 } });
    allBackgrounds.value = data
      .filter((file: any) => {
        const t = file.type || '';
        const n = (file.filename_download || file.title || '').toLowerCase();
        return t.startsWith('image/') || t.startsWith('video/') || n.match(/\.(jpg|jpeg|png|gif|webp|svg|mp4|mov|webm|ogg)$/);
      })
      .map((file: any) => {
        const t = file.type || '';
        const n = (file.filename_download || file.title || '').toLowerCase();
        return {
          id: file.id,
          url: `${directusUrl}/assets/${file.id}`,
          type: (t.startsWith('video/') || n.match(/\.(mp4|mov|webm|ogg)$/)) ? "video" : "image",
          folder: typeof file.folder === 'string' ? file.folder : file.folder?.id || "root",
        };
      });
  } catch (err) {
    console.error("Error fetching backgrounds from directus:", err);
  }
};

const fetchFolders = async () => {
  try {
    const res = await fetch(`${directusUrl}/folders?limit=-1`, {
      headers: { Authorization: `Bearer ${token.value}` }
    });
    const json = await res.json();
    const folders = json.data || [];
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
    const res = await fetch(`${directusUrl}/folders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.value}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, parent: parentId })
    });
    const json = await res.json();
    if (json.data) {
      toast.add({ title: t("common.success"), color: "success" });
      await refreshGallery();
      navigateToFolder(json.data.id);
    } else {
      throw new Error(json.errors?.[0]?.message || "Failed to create folder");
    }
  } catch (err: any) {
    toast.add({ title: t("common.error"), description: err.message, color: "error" });
  }
};

const handleRenameFolder = async (id: string, newName: string) => {
  if (!newName) return;
  try {
    const res = await fetch(`${directusUrl}/folders/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token.value}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: newName }),
    });
    const json = await res.json();
    if (json.data) {
      toast.add({ title: t("manage.backgrounds.renameSuccess"), color: "success" });
      await refreshGallery();
    } else {
      throw new Error(json.errors?.[0]?.message || "Failed to rename folder");
    }
  } catch (err: any) {
    toast.add({ title: t("manage.backgrounds.renameError"), description: err.message, color: "error" });
  }
};

const deleteFolder = async (folderId: string) => {
  if (!confirm(t("manage.backgrounds.deleteFolderConfirm", { folder: folderId }))) return;
  try {
    const res = await fetch(`${directusUrl}/folders/${folderId}`, { 
      method: "DELETE",
      headers: { Authorization: `Bearer ${token.value}` }
    });
    if (res.ok) {
       toast.add({ title: t("common.success"), color: "success" });
       await refreshGallery();
       navigateToFolder(null);
    } else {
       const json = await res.json();
       throw new Error(json.errors?.[0]?.message || "Failed to delete folder");
    }
  } catch (err: any) {
    toast.add({ title: t("common.error"), description: err.message, color: "error" });
  }
};

const deleteMedia = async (item: BackgroundItem) => {
  if (!confirm(t("manage.backgrounds.deleteConfirm"))) return;
  if (!item.id) return;
  try {
    await deleteFiles({ files: [item.id] });
    await refreshGallery();
  } catch (error) {
    console.error("Failed to delete directus file:", error);
  }
};

const downloadZip = () => {
  alert("Folder download is managed via Directus UI now.");
};
</script>
