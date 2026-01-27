<template>
  <div class="space-y-6">
    <div class="grid grid-cols-2 gap-4">
      <UFormField :label="$t('modules.system-status.showCPU')">
        <USwitch v-model="config.showCPU" />
      </UFormField>
      <UFormField :label="$t('modules.system-status.showMemory')">
        <USwitch v-model="config.showMemory" />
      </UFormField>
      <UFormField :label="$t('modules.system-status.showUptime')">
        <USwitch v-model="config.showUptime" />
      </UFormField>
      <UFormField :label="$t('modules.system-status.showOSInfo')">
        <USwitch v-model="config.showOSInfo" />
      </UFormField>
    </div>

    <UFormField
      :label="$t('modules.system-status.updateInterval')"
      description="Time between updates in milliseconds"
    >
      <UInput
        v-model.number="config.updateInterval"
        type="number"
        step="1000"
        min="1000"
        size="xl"
        class="w-full"
      />
    </UFormField>
  </div>
</template>

<script setup lang="ts">
import type { SystemStatusModuleConfig } from "./index";

const props = defineProps<{
  modelValue: SystemStatusModuleConfig;
}>();

const emit = defineEmits(["update:modelValue"]);

const config = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});
</script>
