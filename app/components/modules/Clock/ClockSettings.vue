<template>
  <div class="space-y-4">
    <UFormField
      :label="$t('modules.clock.displaySeconds')"
      :description="$t('modules.clock.secondsDescription')"
    >
      <div class="flex items-center justify-between">
        <span class="text-sm text-(--ui-text)/70">{{
          $t("modules.clock.displaySeconds")
        }}</span>
        <USwitch v-model="config.displaySeconds" />
      </div>
    </UFormField>
  </div>
</template>

<script setup lang="ts">
import type { ClockModuleConfig } from "./index";

const props = defineProps<{
  modelValue: ClockModuleConfig;
}>();

const emit = defineEmits(["update:modelValue"]);

const config = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});
</script>
