<template>
  <div class="space-y-6">
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h4
          class="text-sm font-bold text-(--ui-text)/60 uppercase tracking-widest"
        >
          {{ $t("modules.news.title") }}
        </h4>
        <UButton
          icon="i-heroicons-plus"
          size="xs"
          variant="ghost"
          :label="$t('modules.news.addFeed')"
          @click="config.feeds.push({ title: '', url: '' })"
        />
      </div>

      <div
        v-for="(feed, fIdx) in config.feeds"
        :key="fIdx"
        class="flex flex-col sm:grid sm:grid-cols-12 gap-3 sm:gap-2 items-start bg-(--ui-bg)/5 p-4 sm:p-0 rounded-lg sm:rounded-none border border-default sm:border-0"
      >
        <div class="w-full sm:col-span-4">
          <UInput
            v-model="feed.title"
            :placeholder="$t('modules.news.feedTitle')"
            size="md"
            class="w-full"
          />
        </div>
        <div class="w-full sm:col-span-7">
          <UInput
            v-model="feed.url"
            :placeholder="$t('modules.news.rssUrl')"
            size="md"
            class="w-full"
          />
        </div>
        <div class="w-full sm:col-span-1 flex justify-end">
          <UButton
            icon="i-heroicons-trash"
            size="sm"
            color="error"
            variant="ghost"
            :label="$t('common.delete')"
            class="sm:hidden w-full"
            @click="config.feeds.splice(fIdx, 1)"
          />
          <UButton
            icon="i-heroicons-trash"
            size="xs"
            color="error"
            variant="ghost"
            class="hidden sm:flex"
            @click="config.feeds.splice(fIdx, 1)"
          />
        </div>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <UFormField :label="$t('modules.news.showSource')">
        <USwitch v-model="config.showSourceTitle" />
      </UFormField>
      <UFormField :label="$t('modules.news.showDate')">
        <USwitch v-model="config.showPublishDate" />
      </UFormField>
    </div>

    <UFormField
      :label="$t('modules.news.rotationInterval')"
      :description="$t('modules.news.rotationDescription')"
    >
      <UInput
        v-model.number="config.rotationInterval"
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
import type { NewsModuleConfig } from "./index";

const props = defineProps<{
  modelValue: NewsModuleConfig;
}>();

const emit = defineEmits(["update:modelValue"]);

const config = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});
</script>
