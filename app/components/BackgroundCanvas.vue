<template>
  <div class="absolute inset-0 z-0 overflow-hidden">
    <TransitionGroup :name="effectiveTransitionMode">
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
          @error="handleMediaError"
        />
        <video
          v-else-if="item.type === 'video'"
          :src="item.url"
          autoplay
          muted
          :loop="videoPlaybackMode === 'loop'"
          playsinline
          class="object-cover w-full h-full"
          @error="handleMediaError"
        ></video>
      </div>
    </TransitionGroup>
    <!-- Overlay for better text readability -->
    <div class="absolute inset-0 bg-black/20 z-10"></div>

    <!-- Preload next image -->
    <div v-if="nextImageUrl" class="hidden">
      <img :src="nextImageUrl" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
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
  () => (store.serverBackground || { url: "", type: "image" }) as BackgroundItem
);

const effectiveTransitionMode = computed(() => {
  // If low power mode is enabled, always use fade
  if (store.config?.background?.lowPowerMode) {
    return "fade";
  }
  return props.transitionMode || "fade";
});

const nextImageUrl = computed(() => {
  if (!props.media || props.media.length <= 1) return null;

  const currentIndex = props.media.findIndex(
    (m) => m.url === currentMedia.value.url
  );
  if (currentIndex === -1) return null;

  let nextIndex: number;
  if (props.playbackOrder === "random") {
    // We don't know the next random one, so we just pick the next one in list
    nextIndex = (currentIndex + 1) % props.media.length;
  } else {
    nextIndex = (currentIndex + 1) % props.media.length;
  }

  const nextItem = props.media[nextIndex];
  return nextItem?.type === "image" ? nextItem.url : null;
});

const stopTimer = () => {
  store.stopStatusPolling();
};

const startTimer = () => {
  store.startStatusPolling();
};

const nextMedia = () => {
  store.triggerNextBackground();
};

const handleMediaError = () => {
  console.error("Media failed to load:", currentMedia.value.url);
  nextMedia();
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
