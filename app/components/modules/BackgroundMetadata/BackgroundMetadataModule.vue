<template>
  <BaseModule v-if="hasVisibleMetadata">
    <div class="flex flex-col space-y-3 text-white">
      <div
        v-if="showFileName && metadata?.fileName"
        class="flex items-center space-x-2"
      >
        <UIcon name="i-heroicons-document" class="w-5 h-5 text-white" />
        <span class="text-base font-bold truncate max-w-[200px]">{{
          metadata.fileName
        }}</span>
      </div>

      <div
        v-if="
          (showFileSize && metadata?.fileSize) ||
          (showMimeType && metadata?.mimeType)
        "
        class="flex items-center space-x-4 text-sm opacity-60 font-bold uppercase tracking-widest"
      >
        <span v-if="showFileSize && metadata?.fileSize">{{
          formatFileSize(metadata.fileSize)
        }}</span>
        <span v-if="showMimeType && metadata?.mimeType">{{
          metadata.mimeType
        }}</span>
      </div>

      <div
        v-if="showGPS && metadata?.gps"
        class="flex items-center space-x-2 text-sm text-white font-bold"
      >
        <UIcon name="i-heroicons-map-pin" class="w-4 h-4" />
        <span
          >{{ metadata.gps.latitude.toFixed(4) }},
          {{ metadata.gps.longitude.toFixed(4) }}</span
        >
      </div>

      <div
        v-if="
          (showCreatedAt && metadata?.createdAt) ||
          (showModifiedAt && metadata?.modifiedAt)
        "
        class="pt-1 space-y-1"
      >
        <div
          v-if="showCreatedAt && metadata?.createdAt"
          class="flex items-center space-x-2 text-sm opacity-40 font-bold uppercase tracking-tighter"
        >
          <UIcon name="i-heroicons-calendar" class="w-4 h-4" />
          <span
            >{{ $t("modules.background-metadata.createdAt") }}:
            {{ formatDate(metadata.createdAt) }}</span
          >
        </div>
        <div
          v-if="showModifiedAt && metadata?.modifiedAt"
          class="flex items-center space-x-2 text-sm opacity-40 font-bold uppercase tracking-tighter"
        >
          <UIcon name="i-heroicons-pencil-square" class="w-4 h-4" />
          <span
            >{{ $t("modules.background-metadata.modifiedAt") }}:
            {{ formatDate(metadata.modifiedAt) }}</span
          >
        </div>
      </div>
    </div>
  </BaseModule>
</template>

<script setup lang="ts">
import { BaseModule } from "../BaseModule";
import type { BackgroundMetadataModuleConfig } from "./index";
import { useConfigStore } from "~~/stores/config";

const props = defineProps<BackgroundMetadataModuleConfig>();
const store = useConfigStore();

const metadata = computed(() => store.serverBackground?.metadata);

// Check if there's any meaningful metadata to display based on config
const hasVisibleMetadata = computed(() => {
  if (!metadata.value) return false;

  const m = metadata.value;
  const hasFileName = props.showFileName && m.fileName;
  const hasFileSize = props.showFileSize && m.fileSize;
  const hasMimeType = props.showMimeType && m.mimeType;
  const hasGPS = props.showGPS && m.gps;
  const hasCreatedAt = props.showCreatedAt && m.createdAt;
  const hasModifiedAt = props.showModifiedAt && m.modifiedAt;

  return (
    hasFileName ||
    hasFileSize ||
    hasMimeType ||
    hasGPS ||
    hasCreatedAt ||
    hasModifiedAt
  );
});

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString([], {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
</script>
