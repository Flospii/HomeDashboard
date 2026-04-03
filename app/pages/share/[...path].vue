<template>
  <div class="share-page min-h-screen text-default relative overflow-hidden">
    <!-- Animated Gradient Background -->
    <div class="share-bg absolute inset-0 -z-10" />
    <div class="share-glow absolute inset-0 -z-10" />

    <!-- Main Content -->
    <div class="relative z-10 px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-7xl mx-auto">

      <!-- Hero Header -->
      <header class="share-hero mb-10 text-center sm:text-left">
        <div class="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <!-- Theme Toggle -->
          <div class="absolute top-6 right-6 sm:top-8 sm:right-8">
            <ThemeToggle />
          </div>

          <!-- Icon Badge -->
          <div
            class="shrink-0 w-16 h-16 rounded-2xl bg-linear-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.3)] ring-1 ring-primary-400/20">
            <UIcon name="i-lucide-cloud-upload" class="w-8 h-8 text-white" />
          </div>

          <div class="space-y-2">
            <h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight capitalize leading-tight">
              {{ folderName }}
            </h1>
            <p class="text-sm text-default/40 font-medium tracking-wide max-w-lg">
              {{ $t('manage.backgrounds.subtitle') }}
            </p>
          </div>
        </div>

        <!-- Stats Bar -->
        <div class="mt-8 flex flex-wrap items-center justify-center sm:justify-start gap-4">
          <div
            class="flex items-center gap-2 px-4 py-2 rounded-full bg-default/5 border border-default/10 text-xs font-semibold text-default/60">
            <UIcon name="i-lucide-images" class="w-3.5 h-3.5 text-primary-400" />
            <span>{{ imageCount }} {{ imageCount === 1 ? 'Image' : 'Images' }}</span>
          </div>
          <div
            class="flex items-center gap-2 px-4 py-2 rounded-full bg-default/5 border border-default/10 text-xs font-semibold text-default/60">
            <UIcon name="i-lucide-video" class="w-3.5 h-3.5 text-primary-400" />
            <span>{{ videoCount }} {{ videoCount === 1 ? 'Video' : 'Videos' }}</span>
          </div>
          <div v-if="galleryFolders.length > 0"
            class="flex items-center gap-2 px-4 py-2 rounded-full bg-default/5 border border-default/10 text-xs font-semibold text-default/60">
            <UIcon name="i-lucide-folder" class="w-3.5 h-3.5 text-primary-400" />
            <span>{{ galleryFolders.length }} {{ galleryFolders.length === 1 ? 'Folder' : 'Folders' }}</span>
          </div>
        </div>
      </header>

      <!-- Glass Content Card -->
      <div class="share-card rounded-2xl border border-default/10 backdrop-blur-xl shadow-2xl overflow-hidden">
        <!-- Upload Section -->
        <div class="p-6 sm:p-8 border-b border-default/5">
          <MediaUpload
            :current-folder="sharedPath"
            @success="refreshGallery"
          />
        </div>

        <!-- Gallery Section -->
        <div class="p-6 sm:p-8">
          <MediaGallery
            :media="displayedMedia"
            :folders="galleryFolders"
            :all-backgrounds="allBackgrounds"
            :breadcrumb-parts="[]"
            :current-folder="sharedPath"
            :is-loading="isLoadingMedia"
            :is-shared-view="true"
            @navigate="handleNavigate"
            @download="downloadZip"
          />
        </div>
      </div>

      <!-- Footer -->
      <footer class="mt-12 text-center">
        <p class="text-[11px] text-default/20 font-medium tracking-widest uppercase">
          Powered by HomeDashboard
        </p>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import type { BackgroundItem } from "~~/app/types/config";

// Components
import MediaUpload from "~/components/background/MediaUpload.vue";
import MediaGallery from "~/components/background/MediaGallery.vue";

const route = useRoute();

// The path can be a string or an array depending on how it's handled in Nuxt
const pathParam = computed(() => {
    const p = route.params.path;
    return Array.isArray(p) ? p.join('/') : p;
});

const sharedRoot = pathParam.value || '';
const currentSubPath = ref<string | null>(null);

const sharedPath = computed(() => {
    if (!currentSubPath.value) return sharedRoot;
    return currentSubPath.value;
});

const folderName = computed(() => {
    const p = sharedPath.value;
    if (!p) return "";
    const folder = availableFolders.value.find(f => f.id === p);
    if (folder) return folder.name;
    return p.split('/').pop() || p;
});

const allBackgrounds = ref<BackgroundItem[]>([]);

interface DirectusFolder {
  id: string;
  name: string;
  parent: string | null;
}

const availableFolders = ref<DirectusFolder[]>([]);
const isLoadingMedia = ref(true);

const imageCount = computed(() => displayedMedia.value.filter(i => i.type === 'image').length);
const videoCount = computed(() => displayedMedia.value.filter(i => i.type === 'video').length);

// Removed directus tools, using server API
const { token } = useDirectusToken();


const fetchAllBackgrounds = async () => {
  try {
    const data = await $fetch<BackgroundItem[]>('/api/media/files', {
      headers: token.value ? { Authorization: `Bearer ${token.value}` } : {}
    });
    allBackgrounds.value = data;
  } catch (err) {
    console.error("Error fetching backgrounds from server:", err);
  }
};

const fetchFolders = async () => {
  try {
    const folders = await $fetch<any[]>('/api/media/folders', {
      headers: token.value ? { Authorization: `Bearer ${token.value}` } : {}
    });
    availableFolders.value = [{ id: 'root', name: 'Root', parent: null }, ...folders];
  } catch (err) {
    console.error("Error fetching folders from server:", err);
    availableFolders.value = [{ id: 'root', name: 'Root', parent: null }];
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
  const currentId = sharedPath.value && sharedPath.value !== "root" ? sharedPath.value : null;
  return availableFolders.value.filter(f => {
    if (currentId === null) return !f.parent;
    return f.parent === currentId;
  }).sort((a, b) => a.name.localeCompare(b.name));
});

const displayedMedia = computed(() => {
  return allBackgrounds.value.filter((item) => item.folder === sharedPath.value);
});

const handleNavigate = (path: string | null) => {
    currentSubPath.value = path;
};

const downloadZip = () => {
  // Directus raw archiving requires a custom endpoint. 
  // Disable for now, or redirect to Directus admin.
  alert("Folder download is managed via Directus UI now.");
};

onMounted(() => {
    refreshGallery();
});
</script>

<style scoped>
/* Light mode background */
.share-bg {
  background: linear-gradient(135deg, #f8fafc 0%, #ecfdf5 25%, #f0fdf4 50%, #ecfdf5 75%, #f8fafc 100%);
  background-size: 400% 400%;
  animation: gradientShift 20s ease infinite;
}

.share-glow {
  background: radial-gradient(ellipse 80% 60% at 50% -20%, rgba(16, 185, 129, 0.08), transparent);
}

/* Dark mode background */
:root.dark .share-bg {
  background: linear-gradient(135deg, #020617 0%, #0a0f1a 25%, #041210 50%, #0a0f1a 75%, #020617 100%);
  background-size: 400% 400%;
}

:root.dark .share-glow {
  background: radial-gradient(ellipse 80% 60% at 50% -20%, rgba(16, 185, 129, 0.15), transparent);
}

@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  25% { background-position: 100% 50%; }
  50% { background-position: 100% 0%; }
  75% { background-position: 0% 100%; }
}

/* Hero entrance animation */
.share-hero {
  animation: heroIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes heroIn {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Card — light mode */
.share-card {
  animation: cardIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both;
  background: rgba(255, 255, 255, 0.6);
  box-shadow:
    0 0 0 1px rgba(16, 185, 129, 0.05),
    0 20px 60px -12px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

/* Card — dark mode */
:root.dark .share-card {
  background: rgba(255, 255, 255, 0.03);
  box-shadow:
    0 0 0 1px rgba(16, 185, 129, 0.05),
    0 20px 60px -12px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.03);
}

@keyframes cardIn {
  from { opacity: 0; transform: translateY(32px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

/* Override component styles */
:deep(.u-card) {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}
</style>
