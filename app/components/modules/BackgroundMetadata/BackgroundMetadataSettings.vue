<template>
  <div class="space-y-6">
    <div class="grid grid-cols-2 gap-4">
      <UFormField :label="$t('modules.background-metadata.fileName')">
        <USwitch v-model="config.showFileName" />
      </UFormField>
      <UFormField :label="$t('modules.background-metadata.fileSize')">
        <USwitch v-model="config.showFileSize" />
      </UFormField>
      <UFormField :label="$t('modules.background-metadata.mimeType')">
        <USwitch v-model="config.showMimeType" />
      </UFormField>
      <UFormField :label="$t('modules.background-metadata.gps')">
        <USwitch v-model="config.showGPS" />
      </UFormField>
      <UFormField :label="$t('modules.background-metadata.settings.createdAt')">
        <USwitch v-model="config.showCreatedAt" />
      </UFormField>
      <UFormField
        :label="$t('modules.background-metadata.settings.modifiedAt')"
      >
        <USwitch v-model="config.showModifiedAt" />
      </UFormField>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BackgroundMetadataModuleConfig } from "./index";

const props = defineProps<{
  modelValue: BackgroundMetadataModuleConfig;
}>();

const emit = defineEmits(["update:modelValue"]);

const config = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});
</script>
