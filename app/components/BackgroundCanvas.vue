<template>
  <div class="absolute inset-0 z-0 overflow-hidden bg-black">
    <TransitionGroup
      :name="effectiveTransitionMode"
      tag="div"
      class="relative w-full h-full"
    >
      <div
        v-for="item in displayBackgrounds"
        :key="item.url + store.serverStateId"
        class="absolute inset-0 w-full h-full bg-black"
      >
        <img
          v-if="item.type === 'image'"
          :src="item.url"
          class="object-cover w-full h-full"
          alt="Background"
          @error="
            (e) => console.error('BackgroundCanvas: Image error', item.url, e)
          "
        />
        <video
          v-else-if="item.type === 'video'"
          :src="item.url"
          autoplay
          muted
          loop
          playsinline
          class="object-cover w-full h-full"
          @error="
            (e) => console.error('BackgroundCanvas: Video error', item.url, e)
          "
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
import { computed, watch, onMounted } from "vue";
import { useConfigStore } from "~~/stores/config";

const props = defineProps<{
  transitionMode?: string;
}>();

const store = useConfigStore();

const displayBackgrounds = computed(() => {
  return store.serverBackground ? [store.serverBackground] : [];
});

watch(
  () => store.serverBackground,
  (newBg) => {
    // Background updated
  }
);

onMounted(() => {
  // Component mounted
});

const effectiveTransitionMode = computed(() => {
  // If low power mode is enabled, always use fade
  if (store.config?.background?.lowPowerMode) {
    return "fade";
  }
  return props.transitionMode || "fade";
});

const nextImageUrl = computed(() => {
  if (store.serverNextBackground?.type === "image") {
    return store.serverNextBackground.url;
  }
  return null;
});
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
