<template>
  <BaseModule :dimmed="isNight">
    <div class="flex flex-col items-center justify-center text-white">
      <div
        class="text-4xl md:text-7xl font-bold tracking-tighter tabular-nums [text-shadow:0_0_20px_rgba(255,255,255,0.3)]"
      >
        {{ timeString }}
      </div>
      <div
        class="text-sm md:text-2xl font-medium opacity-60 mt-1 md:mt-2 tracking-wide uppercase"
      >
        {{ dateString }}
      </div>
    </div>
  </BaseModule>
</template>

<script setup lang="ts">
import BaseModule from "./BaseModule.vue";

import type { ClockModuleConfig } from "../../types/config";

const props = defineProps<ClockModuleConfig>();

const now = ref(new Date());
const isNight = computed(() => {
  const hours = now.value.getHours();
  return hours >= 22 || hours < 6;
});

const timeString = computed(() => {
  return now.value.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: props.displaySeconds ? "2-digit" : undefined,
    hour12: false,
  });
});

const dateString = computed(() => {
  return now.value.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
});

let timer: any = null;

onMounted(() => {
  timer = setInterval(() => {
    now.value = new Date();
  }, 1000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>
