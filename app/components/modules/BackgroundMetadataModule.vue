<template>
  <BaseModule v-if="shouldShow">
    <div class="flex flex-col text-white max-w-[300px] space-y-2">
      <!-- Primary Info: GPS & Created At -->
      <div class="space-y-1">
        <div
          v-if="showGPS && metadata?.gps"
          class="flex items-center space-x-2 text-xs md:text-sm font-bold uppercase tracking-widest text-white/80"
        >
          <UIcon name="i-heroicons-map-pin" class="w-4 h-4 text-white" />
          <span
            >{{ metadata.gps.latitude.toFixed(4) }},
            {{ metadata.gps.longitude.toFixed(4) }}</span
          >
        </div>

        <div
          v-if="showCreatedAt && metadata?.createdAt"
          class="flex items-center space-x-2 text-[10px] md:text-xs font-bold uppercase tracking-widest text-white/60"
        >
          <UIcon name="i-heroicons-calendar-days" class="w-3.5 h-3.5" />
          <span>{{
            new Date(metadata.createdAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          }}</span>
        </div>
      </div>

      <!-- Secondary Info: File Details -->
      <div
        v-if="hasSecondaryInfo && metadata"
        :class="[
          'space-y-1.5',
          hasPrimaryInfo ? 'pt-2 border-t border-white/10' : '',
        ]"
      >
        <h3
          v-if="showFileName"
          class="text-xs md:text-sm font-medium text-white/40 break-all leading-tight italic"
        >
          {{ metadata.fileName }}
        </h3>

        <div
          class="flex flex-wrap gap-x-3 gap-y-1 text-[8px] md:text-[9px] opacity-20 uppercase tracking-widest font-bold"
        >
          <div v-if="showFileSize" class="flex items-center space-x-1">
            <UIcon name="i-heroicons-document-duplicate" class="w-2.5 h-2.5" />
            <span>{{ (metadata.fileSize / 1024).toFixed(1) }} KB</span>
          </div>
          <div v-if="showMimeType" class="flex items-center space-x-1">
            <UIcon name="i-heroicons-tag" class="w-2.5 h-2.5" />
            <span>{{ metadata.mimeType }}</span>
          </div>
          <div
            v-if="showModifiedAt && metadata.modifiedAt"
            class="flex items-center space-x-1"
          >
            <UIcon name="i-heroicons-pencil-square" class="w-2.5 h-2.5" />
            <span
              >{{ $t("manage.modules.metadata.modifiedAt") }}:
              {{ new Date(metadata.modifiedAt).toLocaleDateString() }}</span
            >
          </div>
        </div>
      </div>
    </div>
  </BaseModule>
</template>

<script setup lang="ts">
import BaseModule from "./BaseModule.vue";
import { useConfigStore } from "~~/stores/config";
import type {
  BackgroundMetadataModuleConfig,
  MediaMetadata,
} from "../../types/config";

const props = withDefaults(defineProps<BackgroundMetadataModuleConfig>(), {
  showFileName: true,
  showFileSize: true,
  showMimeType: true,
  showCreatedAt: false,
  showModifiedAt: false,
  showGPS: true,
});

const store = useConfigStore();
const metadata = computed<MediaMetadata | undefined>(
  () => store.serverBackground?.metadata
);

const hasPrimaryInfo = computed(() => {
  if (!metadata.value) return false;
  return (
    (props.showGPS && !!metadata.value.gps) ||
    (props.showCreatedAt && !!metadata.value.createdAt)
  );
});

const hasSecondaryInfo = computed(() => {
  if (!metadata.value) return false;
  return (
    props.showFileName ||
    props.showFileSize ||
    props.showMimeType ||
    (props.showModifiedAt && !!metadata.value.modifiedAt)
  );
});

const shouldShow = computed(
  () => hasPrimaryInfo.value || hasSecondaryInfo.value
);
</script>
