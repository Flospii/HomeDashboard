<template>
  <BaseModule>
    <div class="flex flex-col space-y-4 text-white">
      <div v-if="currentFeed" class="space-y-2">
        <div
          v-if="showSourceTitle"
          class="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-white opacity-80"
        >
          {{ currentFeed.source }}
        </div>

        <div
          class="text-lg md:text-2xl font-bold leading-tight [text-shadow:0_2px_10px_rgba(0,0,0,0.5)]"
        >
          {{ currentFeed.title }}
        </div>

        <div class="text-xs md:text-sm opacity-60 line-clamp-2 leading-relaxed">
          {{ currentFeed.description }}
        </div>

        <div
          v-if="showPublishDate"
          class="text-[8px] md:text-[10px] opacity-40 uppercase tracking-widest font-bold pt-2"
        >
          {{ currentFeed.date }}
        </div>
      </div>
      <div v-if="isLoading" class="flex items-center space-x-2 text-white/50">
        <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
        <span class="text-xs font-bold uppercase tracking-widest">{{
          $t("modules.news.fetching")
        }}</span>
      </div>

      <div
        v-else-if="error"
        class="text-xs text-red-400 font-bold uppercase tracking-widest"
      >
        {{ $t("modules.news.error") }}
      </div>

      <div
        v-else-if="!items.length"
        class="text-xs text-white/30 font-bold uppercase tracking-widest"
      >
        {{ $t("modules.news.noFeeds") }}
      </div>
    </div>
  </BaseModule>
</template>

<script setup lang="ts">
import { BaseModule } from "../BaseModule";
import type { NewsModuleConfig } from "./index";

const props = defineProps<NewsModuleConfig>();

const items = ref<any[]>([]);
const currentIndex = ref(0);
const isLoading = ref(true);
const error = ref<string | null>(null);

const currentFeed = computed(() => items.value[currentIndex.value]);

const fetchFeeds = async () => {
  const allItems: any[] = [];
  isLoading.value = true;
  error.value = null;

  try {
    for (const feed of props.feeds) {
      try {
        const data = await $fetch<any[]>("/api/news", {
          params: { url: feed.url },
        });

        if (Array.isArray(data)) {
          data.forEach((item: any) => {
            allItems.push({
              source: feed.title,
              title: item.title,
              description: item.description,
              date: item.formattedDate + " " + item.formattedTime,
              timestamp: new Date(item.pubDate).getTime(),
            });
          });
        }
      } catch (err) {
        console.error(`Failed to fetch feed ${feed.title}:`, err);
      }
    }
    // Sort by date descending
    items.value = allItems.sort((a, b) => b.timestamp - a.timestamp);
  } catch (err: any) {
    console.error("Failed to fetch news feeds:", err);
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
};

let rotateTimer: any = null;
let fetchTimer: any = null;

const startRotation = () => {
  if (rotateTimer) clearInterval(rotateTimer);
  rotateTimer = setInterval(() => {
    if (items.value.length > 0) {
      currentIndex.value = (currentIndex.value + 1) % items.value.length;
    }
  }, props.rotationInterval || 15000);
};

onMounted(() => {
  fetchFeeds();
  startRotation();
  fetchTimer = setInterval(fetchFeeds, 60 * 60 * 1000); // Fetch every hour
});

watch(() => props.rotationInterval, startRotation);

onUnmounted(() => {
  if (rotateTimer) clearInterval(rotateTimer);
  if (fetchTimer) clearInterval(fetchTimer);
});
</script>
