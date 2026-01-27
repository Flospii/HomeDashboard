<template>
  <div class="space-y-6">
    <UFormField
      :label="$t('modules.qrcode.type')"
      :description="$t('modules.qrcode.typeDescription')"
    >
      <USelect
        v-model="config.type"
        :items="[
          {
            label: $t('modules.qrcode.custom'),
            value: 'custom',
          },
          {
            label: $t('modules.qrcode.mediaUpload'),
            value: 'media-upload',
          },
        ]"
        size="xl"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="$t('modules.qrcode.title')"
      :description="$t('modules.qrcode.titleDescription')"
    >
      <UInput
        v-model="config.title"
        :placeholder="$t('modules.qrcode.title')"
        size="xl"
      />
    </UFormField>

    <UFormField
      v-if="config.type === 'custom'"
      :label="$t('modules.qrcode.url')"
      :description="$t('modules.qrcode.urlDescription')"
    >
      <UInput v-model="config.customUrl" placeholder="https://..." size="xl" />
    </UFormField>
    <UFormField
      :label="$t('modules.qrcode.showUrl')"
      :description="$t('modules.qrcode.showUrlDescription')"
    >
      <USwitch v-model="config.showUrl" size="lg" />
    </UFormField>
  </div>
</template>

<script setup lang="ts">
import type { QRCodeModuleConfig } from "./index";

const props = defineProps<{
  modelValue: QRCodeModuleConfig;
}>();

const emit = defineEmits(["update:modelValue"]);

const config = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});
</script>
