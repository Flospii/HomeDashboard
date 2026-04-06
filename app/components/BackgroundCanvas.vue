<template>
  <div class="absolute inset-0 z-0 overflow-hidden bg-black">
    <TransitionGroup :name="effectiveTransitionMode" tag="div" class="relative w-full h-full">
      <div v-for="item in displayBackgrounds" :key="item.id + store.serverStateId"
        class="absolute inset-0 w-full h-full bg-black">
        <img v-if="item.type === 'image'" :src="'/api/media/file/' + item.id" class="object-cover w-full h-full"
          alt="Background" @error="
            (e) => console.error('BackgroundCanvas: Image error', item.id, e)
          " />
        <video v-else-if="item.type === 'video'" autoplay muted loop playsinline preload="metadata"
          class="object-cover w-full h-full" @error="
            (e) => console.error('BackgroundCanvas: Video error', item.id, e)
          ">
          <source :src="'/api/media/file/' + item.id">
        </video>
      </div>
    </TransitionGroup>
    <!-- Overlay for better text readability -->
    <div class="absolute inset-0 bg-black/20 z-10"></div>

    <!-- Preload next media -->
    <div v-if="nextMediaId" class="hidden">
      <img v-if="store.serverNextBackground?.type === 'image'" :src="'/api/media/file/' + nextMediaId" />
      <video v-else-if="!store.config?.background?.lowPowerMode" :src="'/api/media/file/' + nextMediaId"
        preload="metadata" muted />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, onMounted } from "vue";
import { useConfigStore } from "~/stores/config";

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

const nextMediaId = computed(() => {
  if (store.serverNextBackground) {
    return store.serverNextBackground.id;
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

/* Slide (Horizontal) */
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

/* Slide Up */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 1.5s ease-in-out;
}

.slide-up-enter-from {
  transform: translateY(100%);
}

.slide-up-leave-to {
  transform: translateY(-100%);
}

/* Slide Down */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: transform 1.5s ease-in-out;
}

.slide-down-enter-from {
  transform: translateY(-100%);
}

.slide-down-leave-to {
  transform: translateY(100%);
}

/* Zoom (Legacy/Default) */
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

/* Zoom In */
.zoom-in-enter-active,
.zoom-in-leave-active {
  transition: transform 2s ease-in-out, opacity 2s ease-in-out;
}

.zoom-in-enter-from {
  transform: scale(0.8);
  opacity: 0;
}

.zoom-in-leave-to {
  transform: scale(1.2);
  opacity: 0;
}

/* Zoom Out */
.zoom-out-enter-active,
.zoom-out-leave-active {
  transition: transform 2s ease-in-out, opacity 2s ease-in-out;
}

.zoom-out-enter-from {
  transform: scale(1.2);
  opacity: 0;
}

.zoom-out-leave-to {
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

/* Flip */
.flip-enter-active,
.flip-leave-active {
  transition: transform 1.5s ease-in-out, opacity 1.5s ease-in-out;
  backface-visibility: hidden;
}

.flip-enter-from {
  transform: rotateY(-180deg);
  opacity: 0;
}

.flip-leave-to {
  transform: rotateY(180deg);
  opacity: 0;
}

/* Rotate */
.rotate-enter-active,
.rotate-leave-active {
  transition: transform 1.5s ease-in-out, opacity 1.5s ease-in-out;
}

.rotate-enter-from {
  transform: rotate(15deg) scale(1.1);
  opacity: 0;
}

.rotate-leave-to {
  transform: rotate(-15deg) scale(0.9);
  opacity: 0;
}

/* None */
.none-enter-active,
.none-leave-active {
  transition: none !important;
}

.none-enter-from,
.none-leave-to {
  opacity: 1;
}
</style>
