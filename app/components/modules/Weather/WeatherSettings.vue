<template>
  <div class="space-y-6">
    <UFormField :label="$t('modules.weather.provider')">
      <USelect
        v-model="config.weatherProvider"
        :items="['openmeteo']"
        size="xl"
        class="w-full"
      />
    </UFormField>
    <div class="grid grid-cols-2 gap-4">
      <UFormField :label="$t('modules.weather.latitude')">
        <UInput
          v-model.number="config.lat"
          type="number"
          size="md"
          placeholder="48.0986"
        />
      </UFormField>
      <UFormField :label="$t('modules.weather.longitude')">
        <UInput
          v-model.number="config.lon"
          type="number"
          size="md"
          placeholder="14.0353"
        />
      </UFormField>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <UFormField :label="$t('modules.weather.showProvider')">
        <USwitch v-model="config.showProvider" />
      </UFormField>
      <UFormField :label="$t('modules.weather.showWindSpeed')">
        <USwitch v-model="config.showWindSpeed" />
      </UFormField>
      <UFormField :label="$t('modules.weather.showHumidity')">
        <USwitch v-model="config.showHumidity" />
      </UFormField>
      <UFormField :label="$t('modules.weather.showSunriseSunset')">
        <USwitch v-model="config.showSunriseSunset" />
      </UFormField>
      <UFormField :label="$t('modules.weather.showLocation')">
        <USwitch v-model="config.showLocation" />
      </UFormField>
      <UFormField :label="$t('modules.weather.showForecast')">
        <USwitch v-model="config.showForecast" />
      </UFormField>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { WeatherModuleConfig } from "./index";

const props = defineProps<{
  modelValue: WeatherModuleConfig;
}>();

const emit = defineEmits(["update:modelValue"]);

const config = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});
</script>
