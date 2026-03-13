<template>
  <div class="space-y-8">
    <!-- Drag & Drop Zone -->
    <div
      class="border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer flex flex-col justify-center items-center relative mb-8"
      :class="[
        isDragging
          ? 'border-primary-500 bg-primary-500/10 scale-[1.02]'
          : 'border-default/30 hover:border-primary-500/50 hover:bg-primary-500/5',
      ]"
      @click="triggerFileInput"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
    >
      <UIcon
        :name="isDragging ? 'i-lucide-download' : 'i-lucide-upload-cloud'"
        class="w-10 h-10 mb-3 transition-colors duration-300"
        :class="isDragging ? 'text-primary-500' : 'text-default/40'"
      />
      <h3 class="text-base font-bold text-default mb-1">
        {{
          isDragging
            ? $t("manage.backgrounds.dropToUpload")
            : $t("manage.backgrounds.uploadLocal")
        }}
      </h3>
      <p class="text-xs text-default/50 max-w-sm mx-auto">
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

    <!-- Upload Progress Panel -->
    <Transition name="upload-panel">
      <div
        v-if="uploadQueue.length > 0"
        class="upload-panel border border-default rounded-lg overflow-hidden bg-default/5 backdrop-blur-sm"
      >
        <!-- Summary Bar -->
        <div class="px-4 py-3 border-b border-default/30 bg-default/10">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center space-x-3">
              <div
                class="w-8 h-8 rounded-full flex items-center justify-center"
                :class="
                  uploadSummary.isComplete
                    ? 'bg-success-500/20'
                    : 'bg-primary-500/20'
                "
              >
                <UIcon
                  :name="
                    uploadSummary.isComplete
                      ? 'i-lucide-check-circle'
                      : 'i-lucide-upload-cloud'
                  "
                  class="w-4 h-4"
                  :class="
                    uploadSummary.isComplete
                      ? 'text-success-500'
                      : 'text-primary-500'
                  "
                />
              </div>
              <div>
                <p class="text-sm font-bold text-default leading-tight">
                  {{
                    uploadSummary.isComplete
                      ? uploadSummary.errorCount > 0
                        ? $t('manage.backgrounds.uploadPartialComplete', {
                            success: uploadSummary.successCount,
                            total: uploadSummary.total,
                          })
                        : $t('manage.backgrounds.uploadComplete', {
                            total: uploadSummary.total,
                          })
                      : $t('manage.backgrounds.uploadProgress', {
                          current: uploadSummary.successCount + 1,
                          total: uploadSummary.total,
                        })
                  }}
                </p>
                <p class="text-[10px] text-default/40 uppercase tracking-wider font-bold">
                  {{ formatFileSize(uploadSummary.uploadedSize) }} /
                  {{ formatFileSize(uploadSummary.totalSize) }}
                </p>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <UButton
                v-if="hasFailedUploads"
                :label="$t('manage.backgrounds.retryFailed')"
                icon="i-lucide-refresh-cw"
                color="warning"
                variant="soft"
                size="xs"
                @click="retryAllFailed"
              />
              <UButton
                v-if="uploadSummary.isComplete"
                :label="$t('manage.backgrounds.clearCompleted')"
                icon="i-lucide-x"
                color="neutral"
                variant="ghost"
                size="xs"
                @click="clearCompleted"
              />
              <UButton
                v-if="!uploadSummary.isComplete"
                :label="$t('manage.backgrounds.cancelAll')"
                icon="i-lucide-square"
                color="error"
                variant="ghost"
                size="xs"
                @click="cancelAllUploads"
              />
            </div>
          </div>
          <div class="w-full h-1.5 bg-default/10 rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-500 ease-out"
              :class="
                uploadSummary.isComplete && uploadSummary.errorCount === 0
                  ? 'bg-success-500'
                  : uploadSummary.isComplete && uploadSummary.errorCount > 0
                    ? 'bg-warning-500'
                    : 'bg-primary-500'
              "
              :style="{
                width: uploadSummary.overallProgress + '%',
              }"
            />
          </div>
        </div>

        <!-- Upload Items Grid -->
        <div class="p-3 max-h-80 overflow-y-auto">
          <TransitionGroup
            name="upload-item"
            tag="div"
            class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
          >
            <div
              v-for="item in uploadQueue"
              :key="item.id"
              class="upload-card relative aspect-square rounded-lg overflow-hidden border transition-all duration-300 group"
              :class="{
                'border-primary-500/40 shadow-lg shadow-primary-500/10':
                  item.status === 'uploading',
                'border-success-500/40': item.status === 'success',
                'border-error-500/40': item.status === 'error',
                'border-default/20': item.status === 'pending',
              }"
            >
              <!-- Thumbnail -->
              <img
                v-if="item.thumbnailUrl && item.file.type.startsWith('image')"
                :src="item.thumbnailUrl"
                class="w-full h-full object-cover"
                :class="{
                  'opacity-40': item.status === 'pending',
                  'opacity-70': item.status === 'uploading',
                }"
              />
              <div
                v-else
                class="w-full h-full flex flex-col items-center justify-center bg-default/10"
                :class="{ 'opacity-40': item.status === 'pending' }"
              >
                <UIcon name="i-lucide-video" class="w-8 h-8 text-default/30 mb-1" />
                <span class="text-[9px] text-default/30 text-center px-2 truncate w-full">
                  {{ item.file.name }}
                </span>
              </div>

              <!-- Progress Overlay -->
              <div
                v-if="item.status === 'uploading'"
                class="absolute inset-0 flex items-center justify-center bg-black/30"
              >
                <div class="relative w-14 h-14">
                  <svg class="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="24" stroke="currentColor" stroke-width="3" fill="none" class="text-white/20" />
                    <circle
                      cx="28" cy="28" r="24" stroke="currentColor" stroke-width="3" fill="none" class="text-primary-400 transition-all duration-300"
                      stroke-linecap="round"
                      :stroke-dasharray="2 * Math.PI * 24"
                      :stroke-dashoffset="2 * Math.PI * 24 * (1 - item.progress / 100)"
                    />
                  </svg>
                  <span class="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">{{ item.progress }}%</span>
                </div>
              </div>

              <!-- Success Overlay -->
              <div v-if="item.status === 'success'" class="absolute inset-0 flex items-center justify-center bg-success-500/20">
                <div class="w-10 h-10 rounded-full bg-success-500 flex items-center justify-center shadow-lg animate-[scaleIn_0.3s_ease-out]">
                  <UIcon name="i-lucide-check" class="w-5 h-5 text-white" />
                </div>
              </div>

              <!-- Error Overlay -->
              <div v-if="item.status === 'error'" class="absolute inset-0 flex flex-col items-center justify-center bg-error-500/20 gap-2">
                <div class="w-10 h-10 rounded-full bg-error-500 flex items-center justify-center shadow-lg">
                  <UIcon name="i-lucide-x" class="w-5 h-5 text-white" />
                </div>
                <UButton :label="$t('manage.backgrounds.retry')" icon="i-lucide-refresh-cw" color="error" variant="solid" size="xs" @click="retryUpload(item)" />
              </div>

              <!-- Pending Overlay -->
              <div v-if="item.status === 'pending'" class="absolute inset-0 flex items-center justify-center bg-black/20">
                <div class="w-8 h-8 rounded-full bg-default/40 flex items-center justify-center">
                  <UIcon name="i-lucide-clock" class="w-4 h-4 text-white/60" />
                </div>
              </div>

              <!-- File info footer -->
              <div class="absolute bottom-0 left-0 right-0 px-2 py-1.5 bg-linear-to-t from-black/70 to-transparent">
                <p class="text-[9px] text-white/80 truncate font-medium leading-tight">{{ item.file.name }}</p>
                <p class="text-[8px] text-white/40">{{ formatFileSize(item.file.size) }}</p>
              </div>

              <!-- Cancel button -->
              <button
                v-if="item.status === 'pending' || item.status === 'uploading'"
                class="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-error-500"
                @click="cancelUpload(item)"
              >
                <UIcon name="i-lucide-x" class="w-3 h-3 text-white" />
              </button>
            </div>
          </TransitionGroup>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useConfigStore } from "~~/stores/config";

const props = defineProps<{
  currentFolder: string | null;
}>();

const emit = defineEmits<{
  (e: 'success'): void;
}>();

const store = useConfigStore();

interface UploadItem {
  id: string;
  file: File;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  error?: string;
  thumbnailUrl?: string;
  xhr?: XMLHttpRequest;
}

const uploadQueue = ref<UploadItem[]>([]);
const isUploading = ref(false);
const isDragging = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const uploadSummary = computed(() => {
  const items = uploadQueue.value;
  const total = items.length;
  const successCount = items.filter((i) => i.status === "success").length;
  const errorCount = items.filter((i) => i.status === "error").length;
  const isComplete = items.every((i) => i.status === "success" || i.status === "error");
  const totalSize = items.reduce((sum, i) => sum + i.file.size, 0);
  const uploadedSize = items.reduce((sum, i) => {
    if (i.status === "success") return sum + i.file.size;
    if (i.status === "uploading") return sum + (i.file.size * i.progress) / 100;
    return sum;
  }, 0);
  const overallProgress = total > 0 ? Math.round(items.reduce((sum, i) => sum + i.progress, 0) / total) : 0;

  return { total, successCount, errorCount, isComplete, totalSize, uploadedSize, overallProgress };
});

const hasFailedUploads = computed(() => uploadQueue.value.some((i) => i.status === "error"));

const triggerFileInput = () => fileInput.value?.click();

const handleFileUpload = async (event: Event | FileList) => {
  let files: FileList | null = null;
  if (event instanceof Event) {
    const target = event.target as HTMLInputElement;
    files = target.files;
  } else {
    files = event;
  }
  if (!files?.length) return;

  const newItems: UploadItem[] = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (file) {
      const thumbnailUrl = file.type.startsWith("image") ? URL.createObjectURL(file) : undefined;
      newItems.push({
        id: Math.random().toString(36).substr(2, 9),
        file,
        status: "pending",
        progress: 0,
        thumbnailUrl,
      });
    }
  }
  uploadQueue.value = [...uploadQueue.value, ...newItems];
  processQueue();
};

const processQueue = async () => {
  if (isUploading.value) return;
  const pending = uploadQueue.value.find((item) => item.status === "pending");
  if (!pending) {
    if (uploadQueue.value.some((i) => i.status === "success")) {
      emit('success');
    }
    return;
  }

  isUploading.value = true;
  pending.status = "uploading";

  const formData = new FormData();
  formData.append("files", pending.file);
  formData.append("folder", props.currentFolder || "root");

  try {
    await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      pending.xhr = xhr;
      xhr.open("POST", "/api/backgrounds");
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          pending.progress = Math.round((event.loaded / event.total) * 100);
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve(xhr.response);
        else reject(new Error(`Upload failed: ${xhr.status}`));
      };
      xhr.onabort = () => reject(new Error("Upload cancelled"));
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
    processQueue();
  }
};

const handleDrop = (event: DragEvent) => {
  isDragging.value = false;
  const files = event.dataTransfer?.files;
  if (files) handleFileUpload(files);
};

const cancelUpload = (item: UploadItem) => {
  if (item.status === "uploading" && item.xhr) item.xhr.abort();
  if (item.thumbnailUrl) URL.revokeObjectURL(item.thumbnailUrl);
  uploadQueue.value = uploadQueue.value.filter((i) => i.id !== item.id);
};

const cancelAllUploads = () => {
  uploadQueue.value.forEach((item) => {
    if (item.status === "uploading" && item.xhr) item.xhr.abort();
    if (item.thumbnailUrl) URL.revokeObjectURL(item.thumbnailUrl);
  });
  uploadQueue.value = [];
  isUploading.value = false;
};

const retryUpload = (item: UploadItem) => {
  item.status = "pending";
  item.progress = 0;
  item.error = undefined;
  processQueue();
};

const retryAllFailed = () => {
  uploadQueue.value.filter((i) => i.status === "error").forEach((i) => {
    i.status = "pending";
    i.progress = 0;
    i.error = undefined;
  });
  processQueue();
};

const clearCompleted = () => {
  uploadQueue.value.filter((i) => i.status === "success" || i.status === "error").forEach((i) => {
    if (i.thumbnailUrl) URL.revokeObjectURL(i.thumbnailUrl);
  });
  uploadQueue.value = uploadQueue.value.filter((i) => i.status !== "success" && i.status !== "error");
};
</script>

<style scoped>
.upload-panel-enter-active { transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
.upload-panel-leave-active { transition: all 0.3s ease-in; }
.upload-panel-enter-from { opacity: 0; transform: translateY(-12px) scale(0.97); max-height: 0; }
.upload-panel-leave-to { opacity: 0; transform: translateY(-8px) scale(0.98); }

.upload-item-enter-active { transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); }
.upload-item-leave-active { transition: all 0.25s ease-in; position: absolute; }
.upload-item-enter-from { opacity: 0; transform: scale(0.8); }
.upload-item-leave-to { opacity: 0; transform: scale(0.6); }
.upload-item-move { transition: transform 0.3s ease; }

@keyframes scaleIn {
  0% { transform: scale(0); opacity: 0; }
  60% { transform: scale(1.15); }
  100% { transform: scale(1); opacity: 1; }
}
</style>
