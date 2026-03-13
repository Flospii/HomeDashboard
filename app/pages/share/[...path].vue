<template>
  <div class="min-h-screen bg-black text-white p-4 sm:p-8">
    <UContainer m-auto max-w-7xl>
        <UCard variant="glassDark" class="border-0! shadow-none! overflow-hidden">
            <template #header>
                <div class="flex items-center space-x-4">
                    <div class="w-10 h-10 bg-primary-500 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                        <UIcon name="i-heroicons-share" class="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 class="text-xl font-bold tracking-tight uppercase leading-tight">
                            {{ $t('common.share') }}: {{ folderName }}
                        </h1>
                        <p class="text-[10px] uppercase tracking-[0.2em] text-primary-400 font-black">
                            {{ $t('manage.backgrounds.subtitle') }}
                        </p>
                    </div>
                </div>
            </template>

            <!-- Upload Section -->
            <MediaUpload
                :current-folder="sharedPath"
                @success="refreshGallery"
                class="mb-8"
            />

            <!-- Gallery Section -->
            <MediaGallery
                :media="displayedMedia"
                :folders="galleryFolders"
                :all-backgrounds="allBackgrounds"
                :current-folder="sharedPath"
                :is-loading="isLoadingMedia"
                :is-shared-view="true"
                @navigate="handleNavigate"
                @download="downloadZip"
            />
        </UCard>
    </UContainer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { BackgroundItem } from "~~/app/types/config";

// Components
import MediaUpload from "~/components/background/MediaUpload.vue";
import MediaGallery from "~/components/background/MediaGallery.vue";

const route = useRoute();
const router = useRouter();

// The path can be a string or an array depending on how it's handled in Nuxt
const pathParam = computed(() => {
    const p = route.params.path;
    return Array.isArray(p) ? p.join('/') : p;
});

const sharedRoot = pathParam.value;
const currentSubPath = ref<string | null>(null);

const sharedPath = computed(() => {
    if (!currentSubPath.value) return sharedRoot;
    return currentSubPath.value;
});

const folderName = computed(() => {
    const p = sharedPath.value;
    return p.split('/').pop() || p;
});

const allBackgrounds = ref<BackgroundItem[]>([]);
const availableFolders = ref<string[]>([]);
const isLoadingMedia = ref(true);

const fetchAllBackgrounds = async () => {
    try {
        const data = await $fetch<BackgroundItem[]>("/api/backgrounds");
        if (Array.isArray(data)) allBackgrounds.value = data;
    } catch (err) {
        console.error("Error:", err);
    }
};

const fetchFolders = async () => {
    try {
        const data = await $fetch<string[]>("/api/backgrounds/folders");
        if (Array.isArray(data)) availableFolders.value = data;
    } catch (err) {
        console.error("Error:", err);
    }
};

const refreshGallery = async () => {
    isLoadingMedia.value = true;
    const startTime = Date.now();
    try {
        await Promise.all([fetchAllBackgrounds(), fetchFolders()]);
    } finally {
        const elapsed = Date.now() - startTime;
        if (elapsed < 400) await new Promise(r => setTimeout(r, 400 - elapsed));
        isLoadingMedia.value = false;
    }
};

const galleryFolders = computed(() => {
  const currentDepth = sharedPath.value ? sharedPath.value.split("/").length : 0;
  const allFolderPaths = new Set<string>();

  // Filter to only include folders within the shared root
  allBackgrounds.value.forEach((item) => {
    if (item.folder && item.folder.startsWith(sharedRoot)) {
      allFolderPaths.add(item.folder);
      const parts = item.folder.split("/");
      let currentPath = "";
      for (let i = 0; i < parts.length - 1; i++) {
        currentPath = currentPath ? `${currentPath}/${parts[i]}` : (parts[i] as string);
        if (currentPath.startsWith(sharedRoot)) allFolderPaths.add(currentPath);
      }
    }
  });

  availableFolders.value.forEach(folder => {
    if (folder.startsWith(sharedRoot)) allFolderPaths.add(folder);
  });

  return Array.from(allFolderPaths).filter(folder => {
    if (!folder.startsWith(sharedPath.value + "/")) return false;
    return folder.split("/").length === currentDepth + 1;
  }).sort();
});

const displayedMedia = computed(() => {
  return allBackgrounds.value.filter((item) => item.folder === sharedPath.value);
});

const handleNavigate = (path: string | null) => {
    // We only allow navigating within the shared root
    if (path === null || !path.startsWith(sharedRoot)) {
        currentSubPath.value = null;
    } else {
        currentSubPath.value = path;
    }
};

const downloadZip = () => {
  window.location.href = `/api/export-backgrounds?folder=${encodeURIComponent(sharedPath.value)}`;
};

onMounted(() => {
    refreshGallery();
});
</script>

<style scoped>
/* Ensure dark mode is enforced for shared view */
:deep(.u-card) {
    background: rgba(10, 10, 10, 0.8) !important;
}
</style>
