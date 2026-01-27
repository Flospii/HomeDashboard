<template>
  <BaseModule v-if="metadata">
    <div class="flex flex-col space-y-3 text-white">
      <div v-if="showFileName" class="flex items-center space-x-2">
        <UIcon name="i-heroicons-document" class="w-4 h-4 text-white" />
        <span class="text-xs font-bold truncate max-w-[160px]">{{
          metadata.fileName
        }}</span>
      </div>

      <div
        v-if="showFileSize || showMimeType"
        class="flex items-center space-x-4 text-[10px] opacity-60 font-bold uppercase tracking-widest"
      >
        <span v-if="showFileSize">{{ formatFileSize(metadata.fileSize) }}</span>
        <span v-if="showMimeType">{{ metadata.mimeType }}</span>
      </div>

      <div
        v-if="showGPS && metadata.gps"
        class="flex items-center space-x-2 text-[10px] text-white font-bold"
      >
        <UIcon name="i-heroicons-map-pin" class="w-3 h-3" />
        <span
          >{{ metadata.gps.latitude.toFixed(4) }},
          {{ metadata.gps.longitude.toFixed(4) }}</span
        >
      </div>

      <div v-if="showCreatedAt || showModifiedAt" class="pt-1 space-y-1">
        <div
          v-if="showCreatedAt && metadata.createdAt"
          class="flex items-center space-x-2 text-[10px] opacity-40 font-bold uppercase tracking-tighter"
        >
          <UIcon name="i-heroicons-calendar" class="w-3 h-3" />
          <span
            >{{ $t("modules.background-metadata.createdAt") }}:
            {{ formatDate(metadata.createdAt) }}</span
          >
        </div>
        <div
          v-if="showModifiedAt && metadata.modifiedAt"
          class="flex items-center space-x-2 text-[10px] opacity-40 font-bold uppercase tracking-tighter"
        >
          <UIcon name="i-heroicons-pencil-square" class="w-3 h-3" />
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
