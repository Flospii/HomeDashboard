<template>
  <div
    class="w-full max-w-2xl mx-auto glass-module p-8 rounded-3xl shadow-2xl backdrop-blur-md bg-white/10 border border-white/20 text-white"
  >
    <div class="flex items-center justify-between mb-8">
      <h2 class="text-2xl font-bold">Background Manager</h2>
      <UButton
        icon="i-heroicons-home"
        color="neutral"
        variant="ghost"
        to="/"
        label="Back to Dashboard"
      />
    </div>

    <!-- Upload Section -->
    <div class="mb-8">
      <div
        class="border-2 border-dashed border-white/20 rounded-2xl p-12 text-center hover:border-white/40 transition-all cursor-pointer group"
        @click="triggerFileInput"
      >
        <UIcon
          name="i-heroicons-cloud-arrow-up"
          class="w-12 h-12 mx-auto mb-4 opacity-40 group-hover:opacity-100 transition-opacity"
        />
        <p
          class="text-lg opacity-60 group-hover:opacity-100 transition-opacity"
        >
          Click or drag to upload new backgrounds
        </p>
        <p class="text-sm opacity-40 mt-2">Supports images and videos</p>
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

    <!-- Status -->
    <div
      v-if="isUploading"
      class="flex items-center justify-center space-x-3 text-primary-400 animate-pulse"
    >
      <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin" />
      <span>Uploading files...</span>
    </div>

    <!-- Success Message -->
    <div v-if="uploadSuccess" class="text-center text-green-400 text-sm mt-4">
      Upload successful!
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useDashboardStore } from "~~/stores/dashboard";

const store = useDashboardStore();
const isUploading = ref(false);
const uploadSuccess = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (!target.files?.length) return;

  isUploading.value = true;
  uploadSuccess.value = false;
  const formData = new FormData();
  for (let i = 0; i < target.files.length; i++) {
    const file = target.files[i];
    if (file) {
      formData.append("files", file);
    }
  }

  try {
    const response = await fetch("/api/backgrounds", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      // Refresh the dashboard config to show new media
      await store.fetchConfig();
      uploadSuccess.value = true;
      setTimeout(() => {
        uploadSuccess.value = false;
      }, 3000);
    }
  } catch (error) {
    console.error("Upload failed:", error);
  } finally {
    isUploading.value = false;
    if (fileInput.value) fileInput.value.value = "";
  }
};
</script>

<style scoped>
.glass-module {
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
}
</style>
