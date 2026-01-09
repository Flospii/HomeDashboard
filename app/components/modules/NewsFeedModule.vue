<template>
  <BaseModule class="overflow-hidden !p-0">
    <div class="flex flex-col justify-center h-full px-4 md:px-8">
      <div v-if="isLoading" class="opacity-50 italic text-[10px] md:text-sm">
        Fetching latest headlines...
      </div>

      <div
        v-else
        class="relative h-full flex flex-col justify-center overflow-hidden"
      >
        <Transition name="fade-slide" mode="out-in">
          <div
            :key="currentIndex"
            class="flex flex-col space-y-0.5 md:space-y-1 py-1 md:py-2"
          >
            <!-- Row 1: Source, Date and Time -->
            <div
              v-if="showSourceTitle || showPublishDate"
              class="flex items-center space-x-2 md:space-x-3 text-[9px] md:text-xs font-bold uppercase tracking-widest text-white"
            >
              <span v-if="showSourceTitle">{{ currentItem.source }}</span>
              <span
                v-if="showSourceTitle && showPublishDate"
                class="w-0.5 h-0.5 md:w-1 md:h-1 rounded-full bg-white/20"
              ></span>
              <template v-if="showPublishDate">
                <span class="text-white/60">{{ formattedDate }}</span>
                <span
                  class="w-0.5 h-0.5 md:w-1 md:h-1 rounded-full bg-white/20"
                ></span>
                <span class="text-white/40">{{ formattedTime }}</span>
              </template>
            </div>
            <!-- Row 2: Headline -->
            <div
              class="text-sm md:text-lg font-medium text-white/90 [text-shadow:0_2_10px_rgba(0,0,0,0.5)] leading-tight"
            >
              {{ currentItem.title }}
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </BaseModule>
</template>

<script setup lang="ts">
import BaseModule from "./BaseModule.vue";
import type { NewsFeed } from "../../types/config";

interface NewsItem {
  title: string;
  source: string;
  pubDate: string;
  formattedDate: string;
  formattedTime: string;
}

const props = defineProps<{
  feeds: NewsFeed[];
  showSourceTitle: boolean;
  showPublishDate: boolean;
}>();

const news = ref<NewsItem[]>([]);
const isLoading = ref(true);
const currentIndex = ref(0);

const currentItem = computed(
  () =>
    news.value[currentIndex.value] || {
      title: "",
      source: "",
      pubDate: "",
      formattedDate: "",
      formattedTime: "",
    }
);

const formattedTime = computed(() => currentItem.value.formattedTime);
const formattedDate = computed(() => currentItem.value.formattedDate);

const shuffleArray = <T>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = newArray[i];
    newArray[i] = newArray[j] as T;
    newArray[j] = temp as T;
  }
  return newArray;
};

const fetchNews = async () => {
  if (!props.feeds || props.feeds.length === 0) {
    news.value = [
      {
        title: "No news feeds configured.",
        source: "System",
        pubDate: "",
        formattedDate: "",
        formattedTime: "",
      },
    ];
    isLoading.value = false;
    return;
  }

  isLoading.value = true;
  const allItems: NewsItem[] = [];

  try {
    for (const feed of props.feeds) {
      const response = await fetch(
        `/api/news?url=${encodeURIComponent(feed.url)}`
      );
      if (response.ok) {
        const items = await response.json();
        if (Array.isArray(items)) {
          items.forEach((item: any) => {
            allItems.push({
              title: item.title,
              source: feed.title,
              pubDate: item.pubDate,
              formattedDate: item.formattedDate,
              formattedTime: item.formattedTime,
            });
          });
        }
      }
    }

    if (allItems.length > 0) {
      news.value = shuffleArray(allItems);
      currentIndex.value = 0;
    } else {
      news.value = [
        {
          title: "Could not load news headlines.",
          source: "Error",
          pubDate: "",
          formattedDate: "",
          formattedTime: "",
        },
      ];
    }
  } catch (error) {
    console.error("Failed to fetch news:", error);
    news.value = [
      {
        title: "Error loading news.",
        source: "Error",
        pubDate: "",
        formattedDate: "",
        formattedTime: "",
      },
    ];
  } finally {
    isLoading.value = false;
  }
};

let fetchTimer: any = null;
let cycleTimer: any = null;

const startCycling = () => {
  stopCycling();
  if (news.value.length > 1) {
    cycleTimer = setInterval(() => {
      currentIndex.value = (currentIndex.value + 1) % news.value.length;
    }, 8000); // Show each headline for 8 seconds
  }
};

const stopCycling = () => {
  if (cycleTimer) {
    clearInterval(cycleTimer);
    cycleTimer = null;
  }
};

onMounted(() => {
  fetchNews().then(() => {
    startCycling();
  });
  // Refresh feeds every 15 minutes
  fetchTimer = setInterval(fetchNews, 15 * 60 * 1000);
});

onUnmounted(() => {
  if (fetchTimer) clearInterval(fetchTimer);
  stopCycling();
});

watch(
  () => props.feeds,
  () => {
    fetchNews().then(() => {
      startCycling();
    });
  },
  { deep: true }
);

watch(
  () => news.value,
  () => {
    startCycling();
  }
);
</script>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.5s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
