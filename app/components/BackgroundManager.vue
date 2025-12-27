<template>
  <div
    class="w-full max-w-4xl mx-auto glass-module p-8 rounded-3xl shadow-2xl backdrop-blur-md bg-white/10 border border-white/20 text-white"
  >
    <div class="flex items-center justify-between mb-8">
      <h2 class="text-2xl font-bold">Background Media Manager</h2>
      <UButton
        icon="i-heroicons-home"
        color="neutral"
        variant="ghost"
        to="/"
        label="Back to Dashboard"
      />
    </div>

    <!-- Add Section -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
      <!-- Local Upload -->
      <div
        class="border-2 border-dashed border-white/20 rounded-2xl p-8 text-center hover:border-white/40 transition-all cursor-pointer group flex flex-col justify-center"
        @click="triggerFileInput"
      >
        <UIcon
          name="i-heroicons-cloud-arrow-up"
          class="w-10 h-10 mx-auto mb-4 opacity-40 group-hover:opacity-100 transition-opacity"
        />
        <p
          class="text-sm opacity-60 group-hover:opacity-100 transition-opacity"
        >
          Upload local images/videos
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
      <div class="bg-white/5 p-8 rounded-2xl border border-white/10">
        <h3 class="text-sm font-semibold mb-4 opacity-60">Add External URL</h3>
        <div class="space-y-4">
          <UInput
            v-model="newExternal.url"
            placeholder="https://example.com/image.jpg"
            class="w-full"
          />
          <div class="flex space-x-4">
            <USelect
              v-model="newExternal.type"
              :items="['image', 'video']"
              class="flex-1"
            />
            <UButton
              label="Add"
              icon="i-heroicons-plus"
              color="neutral"
              variant="subtle"
              :disabled="!newExternal.url"
              @click="addExternalUrl"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Status Messages -->
    <div
      v-if="isUploading"
      class="text-center text-primary-400 animate-pulse mb-8"
    >
      Uploading files...
    </div>

    <!-- Media Gallery -->
    <div class="space-y-8">
      <h3 class="text-xl font-semibold border-b border-white/10 pb-2">
        Your Backgrounds
      </h3>

      <div
        v-if="store.allBackgrounds.length === 0"
        class="text-center py-12 opacity-40"
      >
        No backgrounds found. Add some above!
      </div>

      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <div
          v-for="(item, index) in store.allBackgrounds"
          :key="item.url"
          class="relative group aspect-video rounded-xl overflow-hidden border border-white/10 bg-black/40"
        >
          <!-- Preview -->
          <img
            v-if="item.type === 'image'"
            :src="item.url"
            class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <video
            v-else
            :src="item.url"
            class="w-full h-full object-cover"
            muted
          />

          <!-- Overlay Actions -->
          <div
            class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2"
          >
            <UButton
              icon="i-heroicons-trash"
              color="error"
              variant="solid"
              size="sm"
              @click="deleteMedia(item)"
            />
          </div>

          <!-- Type Badge -->
          <div
            class="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-[10px] uppercase tracking-wider opacity-60"
          >
            {{ isLocal(item.url) ? "Local" : "External" }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { useDashboardStore } from "~~/stores/dashboard";

const store = useDashboardStore();
const isUploading = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

const newExternal = reactive({
  url: "",
  type: "image" as "image" | "video",
});

const triggerFileInput = () => {
  fileInput.value?.click();
};

const isLocal = (url: string) => url.startsWith("/backgrounds/");

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (!target.files?.length) return;

  isUploading.value = true;
  const formData = new FormData();
  for (let i = 0; i < target.files.length; i++) {
    const file = target.files[i];
    if (file) formData.append("files", file);
  }

  try {
    const response = await fetch("/api/backgrounds", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      await store.fetchConfig();
    }
  } catch (error) {
    console.error("Upload failed:", error);
  } finally {
    isUploading.value = false;
    if (fileInput.value) fileInput.value.value = "";
  }
};

const addExternalUrl = async () => {
  if (!newExternal.url || !store.config) return;

  store.config.background.externalMediaUrlList.push({ ...newExternal });
  newExternal.url = "";
  newExternal.type = "image";

  try {
    await store.saveConfig();
  } catch (error) {
    console.error("Failed to save external URL:", error);
  }
};

const deleteMedia = async (item: any) => {
  if (!confirm(`Are you sure you want to remove this background?`)) return;

  if (isLocal(item.url)) {
    // Delete local file
    const filename = item.url.replace("/backgrounds/", "");
    try {
      const response = await fetch(`/api/backgrounds?filename=${filename}`, {
        method: "DELETE",
      });
      if (response.ok) {
        await store.fetchConfig();
      }
    } catch (error) {
      console.error("Failed to delete local file:", error);
    }
  } else {
    // Remove external URL
    if (!store.config) return;
    const index = store.config.background.externalMediaUrlList.findIndex(
      (m) => m.url === item.url
    );
    if (index !== -1) {
      store.config.background.externalMediaUrlList.splice(index, 1);
      try {
        await store.saveConfig();
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
