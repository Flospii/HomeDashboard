<template>
  <div class="absolute inset-0 z-0 overflow-hidden">
    <TransitionGroup name="fade">
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
}>();

const currentIndex = ref(0);
const currentMedia = computed(
  () => props.media[currentIndex.value] || { url: "", type: "image" }
);

let timer: any = null;

const nextMedia = () => {
  currentIndex.value = (currentIndex.value + 1) % props.media.length;
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
.fade-enter-active,
.fade-leave-active {
  transition: opacity 2s ease-in-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
