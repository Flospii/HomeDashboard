<template>
  <div class="absolute inset-0 z-0 overflow-hidden">
    <TransitionGroup :name="transitionMode || 'fade'">
      <div
        v-for="(item, index) in [currentMedia]"
        :key="item.url + index"
        class="absolute inset-0 w-full h-full"
      >
        <img
          v-if="item.type === 'image'"
          :src="item.url"
          class="object-cover w-full h-full"
          alt="Background"
        />
        <video
          v-else-if="item.type === 'video'"
          :src="item.url"
          autoplay
          muted
          :loop="videoPlaybackMode === 'loop'"
          playsinline
          class="object-cover w-full h-full"
        ></video>
      </div>
    </TransitionGroup>
    <!-- Overlay for better text readability -->
    <div class="absolute inset-0 bg-black/20 z-10"></div>

    <!-- Preloading Layer (Hidden) -->
    <div class="hidden">
      <template v-if="nextMediaItem">
        <img
          v-if="nextMediaItem.type === 'image'"
          :src="nextMediaItem.url"
          loading="eager"
        />
        <video
          v-else-if="nextMediaItem.type === 'video'"
          :src="nextMediaItem.url"
          preload="auto"
          muted
        ></video>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import type {
  BackgroundItem,
  TransitionMode,
  PlaybackMode,
  VideoPlaybackMode,
} from "../types/config";
import { useConfigStore } from "~~/stores/config";

const props = defineProps<{
  media: BackgroundItem[];
  interval?: number;
  transitionMode?: TransitionMode;
  playbackOrder?: PlaybackMode;
  videoPlaybackMode?: VideoPlaybackMode;
}>();

const store = useConfigStore();

const currentMedia = computed(
  () => props.media[store.currentBackgroundIndex] || { url: "", type: "image" }
);

const nextMediaItem = computed(() => {
  if (props.media.length <= 1) return null;
  const nextIndex = (store.currentBackgroundIndex + 1) % props.media.length;
  return props.media[nextIndex];
});

let timer: any = null;

const stopTimer = () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};

const startTimer = () => {
  stopTimer();
  if (props.media.length > 1) {
    timer = setInterval(nextMedia, props.interval || 30000);
  }
};

const nextMedia = () => {
  if (props.playbackOrder === "random" && props.media.length > 1) {
    let nextIndex = store.currentBackgroundIndex;
    while (nextIndex === store.currentBackgroundIndex) {
      nextIndex = Math.floor(Math.random() * props.media.length);
    }
    store.setBackgroundIndex(nextIndex);
  } else {
    store.setBackgroundIndex(
      (store.currentBackgroundIndex + 1) % props.media.length
    );
  }
};

onMounted(() => {
  startTimer();
});

onUnmounted(() => {
  stopTimer();
});

// Watch for changes in interval or media list to restart the timer
watch(
  () => [props.interval, props.media.length],
  () => {
    startTimer();
  }
);
</script>

<style scoped>
/* Fade */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 2s ease-in-out;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Slide */
.slide-enter-active,
.slide-leave-active {
  transition: transform 1.5s ease-in-out;
}
.slide-enter-from {
  transform: translateX(100%);
}
.slide-leave-to {
  transform: translateX(-100%);
}

/* Zoom */
.zoom-enter-active,
.zoom-leave-active {
  transition: transform 2s ease-in-out, opacity 2s ease-in-out;
}
.zoom-enter-from {
  transform: scale(1.2);
  opacity: 0;
}
.zoom-leave-to {
  transform: scale(0.8);
  opacity: 0;
}

/* Blur */
.blur-enter-active,
.blur-leave-active {
  transition: filter 1.5s ease-in-out, opacity 1.5s ease-in-out;
}
.blur-enter-from {
  filter: blur(20px);
  opacity: 0;
}
.blur-leave-to {
  filter: blur(20px);
  opacity: 0;
}
</style>
