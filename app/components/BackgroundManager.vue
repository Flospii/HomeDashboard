<template>
  <UContainer class="py-12">
    <UCard variant="glassDark" class="!border-0 !shadow-none overflow-hidden" :ui="{
      body: 'p-8',
    }">
      <template #header>
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-3xl font-bold text-(--ui-text) tracking-tight">
              {{ $t("manage.backgrounds.title") }}
            </h2>
            <p class="text-(--ui-text)/50 mt-1">
              {{ $t("manage.backgrounds.subtitle") }}
            </p>
          </div>
          <UButton icon="i-heroicons-home" color="neutral" variant="subtle" to="/" :label="$t('dashboard.exit')"
            size="lg" />
        </div>
      </template>

      <!-- Add Section -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <!-- Local Upload -->
        <div
          class="border-2 border-dashed border-(--ui-border) p-10 text-center hover:border-primary-500/50 hover:bg-primary-500/5 transition-all cursor-pointer group flex flex-col justify-center items-center"
          @click="triggerFileInput">
          <div
            class="w-16 h-16 bg-(--ui-bg)/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <UIcon name="i-heroicons-cloud-arrow-up"
              class="w-8 h-8 text-(--ui-text)/40 group-hover:text-primary-400 transition-colors" />
          </div>
          <h3 class="text-lg font-semibold text-(--ui-text) mb-1">
            {{ $t("manage.backgrounds.uploadLocal") }}
          </h3>
          <p class="text-sm text-(--ui-text)/40">
            {{ $t("manage.backgrounds.uploadSubtitle") }}
          </p>
          <input ref="fileInput" type="file" class="hidden" accept="image/*,video/*" multiple
            @change="handleFileUpload" />
        </div>

        <!-- External URL -->
        <UCard :ui="{ body: 'p-10' }" class="bg-(--ui-bg)/5 shadow-none border border-(--ui-border)">
          <h3 class="text-lg font-semibold text-(--ui-text) mb-4">
            {{ $t("manage.backgrounds.addExternal") }}
          </h3>
          <div class="space-y-6">
            <UFormField :label="$t('manage.backgrounds.resourceUrl')">
              <UInput v-model="newExternal.url" :placeholder="$t('common.loading') + '...'" size="xl" class="w-full" />
            </UFormField>
            <div class="flex space-x-4">
              <UFormField :label="$t('manage.backgrounds.type')" class="flex-1">
                <USelect v-model="newExternal.type" :items="['image', 'video']" size="xl" class="w-full" />
              </UFormField>
              <div class="flex items-end">
                <UButton :label="$t('manage.backgrounds.addResource')" icon="i-heroicons-plus" color="primary" size="xl"
                  class="px-8" :disabled="!newExternal.url" @click="addExternalUrl" />
              </div>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Status Messages -->
      <div v-if="isUploading" class="flex items-center justify-center space-x-3 text-primary-400 animate-pulse mb-8">
        <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin" />
        <span class="font-medium">{{
          $t("manage.backgrounds.uploading")
        }}</span>
      </div>

      <!-- Media Gallery -->
      <div class="space-y-8">
        <div class="flex items-center justify-between border-b border-(--ui-border) pb-4">
          <h3 class="text-xl font-bold text-(--ui-text)">
            {{ $t("manage.backgrounds.gallery") }}
          </h3>
          <div class="flex items-center space-x-4">
            <UButton icon="i-heroicons-archive-box-arrow-down" color="neutral" variant="subtle"
              :label="$t('manage.backgrounds.exportZip')" size="sm" @click="downloadZip" />
            <UBadge :label="$t('manage.backgrounds.items', {
              count: store.allBackgrounds.length,
            })
              " color="neutral" variant="subtle" size="lg" />
          </div>
        </div>

        <div v-if="store.allBackgrounds.length === 0"
          class="text-center py-20 bg-(--ui-bg)/5 border border-(--ui-border)">
          <UIcon name="i-heroicons-photo" class="w-16 h-16 mx-auto mb-4 opacity-10" />
          <p class="text-(--ui-text)/30 text-lg">
            {{ $t("manage.backgrounds.noBackgrounds") }}
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <div v-for="(item, index) in store.allBackgrounds" :key="item.url"
            class="relative group aspect-video overflow-hidden border border-(--ui-border) bg-(--ui-bg)/40 shadow-xl">
            <!-- Preview -->
            <img v-if="item.type === 'image'" :src="item.url"
              class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            <video v-else :src="item.url" class="w-full h-full object-cover" muted />

            <!-- Overlay Actions -->
            <div
              class="absolute inset-0 bg-(--ui-bg)/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-sm">
              <UButton icon="i-heroicons-trash" color="error" variant="solid" size="xl"
                class="shadow-2xl scale-75 group-hover:scale-100 transition-transform duration-300"
                @click="deleteMedia(item)" />
            </div>

            <!-- Type Badge -->
            <div
              class="absolute top-4 left-4 px-3 py-1 bg-(--ui-bg)/60 backdrop-blur-md text-[10px] font-bold uppercase tracking-widest text-(--ui-text)/80 border border-(--ui-border)">
              {{
                isLocal(item.url)
                  ? $t("manage.backgrounds.local")
                  : $t("manage.backgrounds.external")
              }}
            </div>
          </div>
        </div>
      </div>
    </UCard>
  </UContainer>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { useConfigStore } from "~~/stores/config";

const { t } = useI18n();

const store = useConfigStore();
const isUploading = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

const newExternal = reactive({
  url: "",
  type: "image" as "image" | "video",
});

const triggerFileInput = () => {
  fileInput.value?.click();
};

const isLocal = (url: string) => url.startsWith("/backgrounds/");

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (!target.files?.length) return;

  isUploading.value = true;
  const formData = new FormData();
  for (let i = 0; i < target.files.length; i++) {
    const file = target.files[i];
    if (file) formData.append("files", file);
  }

  try {
    await $fetch("/api/backgrounds", {
      method: "POST",
      body: formData,
    });
    await store.fetchConfig();
  } catch (error) {
    console.error("Upload failed:", error);
  } finally {
    isUploading.value = false;
    if (fileInput.value) fileInput.value.value = "";
  }
};

const addExternalUrl = async () => {
  if (!newExternal.url || !store.config) return;

  store.config.background.externalMediaUrlList.push({ ...newExternal });
  newExternal.url = "";
  newExternal.type = "image";

  try {
    await store.saveConfig();
  } catch (error) {
    console.error("Failed to save external URL:", error);
  }
};

const downloadZip = () => {
  window.location.href = "/api/export-backgrounds";
};

const deleteMedia = async (item: any) => {
  if (!confirm(t("manage.backgrounds.deleteConfirm"))) return;

  if (isLocal(item.url)) {
    // Delete local file
    const filename = item.url.replace("/backgrounds/", "");
    try {
      await $fetch(`/api/backgrounds?filename=${filename}`, {
        method: "DELETE",
      });
      await store.fetchConfig();
    } catch (error) {
      console.error("Failed to delete local file:", error);
    }
  } else {
    // Remove external URL
    if (!store.config) return;
    const index = store.config.background.externalMediaUrlList.findIndex(
      (m) => m.url === item.url
    );
    if (index !== -1) {
      store.config.background.externalMediaUrlList.splice(index, 1);
      try {
        await store.saveConfig();
      } catch (error) {
        console.error("Failed to remove external URL:", error);
      }
    }
  }
};
</script>

<style scoped>
.glass-module {
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
}
</style>
