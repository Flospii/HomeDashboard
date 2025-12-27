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
          loop
          playsinline
          class="object-cover w-full h-full"
        ></video>
      </div>
    </TransitionGroup>
    <!-- Overlay for better text readability -->
    <div class="absolute inset-0 bg-black/20 z-10"></div>
  </div>
</template>

<script setup lang="ts">
interface MediaItem {
  url: string;
  type: "image" | "video";
}

const props = defineProps<{
  media: MediaItem[];
  interval?: number;
  transitionMode?: "fade" | "slide" | "zoom" | "blur";
  playbackOrder?: "sequential" | "random";
}>();

const currentIndex = ref(0);
const currentMedia = computed(
  () => props.media[currentIndex.value] || { url: "", type: "image" }
);

let timer: any = null;

const nextMedia = () => {
  if (props.playbackOrder === "random" && props.media.length > 1) {
    let nextIndex = currentIndex.value;
    while (nextIndex === currentIndex.value) {
      nextIndex = Math.floor(Math.random() * props.media.length);
    }
    currentIndex.value = nextIndex;
  } else {
    currentIndex.value = (currentIndex.value + 1) % props.media.length;
  }
};

onMounted(() => {
  if (props.media.length > 1) {
    timer = setInterval(nextMedia, props.interval || 30000);
  }
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
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
