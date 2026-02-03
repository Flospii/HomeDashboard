<template>
  <BaseModule>
    <div
      v-if="stats"
      class="flex flex-col space-y-4 min-w-[160px] max-w-[200px] text-white"
    >
      <!-- CPU Usage -->
      <div v-if="showCPU" class="space-y-1.5">
        <div class="flex justify-between items-end">
          <span
            class="text-[10px] font-black uppercase tracking-[0.2em] opacity-40"
            >{{ $t("modules.system-status.cpu") }}</span
          >
          <span class="text-xs font-bold tabular-nums text-white"
            >{{ stats.cpu.usage }}%</span
          >
        </div>
        <div class="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
          <div
            class="h-full bg-white transition-all duration-1000 ease-out"
            :style="{ width: `${stats.cpu.usage}%` }"
          ></div>
        </div>
      </div>

      <!-- Memory Usage -->
      <div v-if="showMemory" class="space-y-1.5">
        <div class="flex justify-between items-end">
          <span
            class="text-[10px] font-black uppercase tracking-[0.2em] opacity-40"
            >{{ $t("modules.system-status.memory") }}</span
          >
          <span class="text-xs font-bold tabular-nums text-white"
            >{{ stats.memory.percentage }}%</span
          >
        </div>
        <div class="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
          <div
            class="h-full bg-white transition-all duration-1000 ease-out"
            :style="{ width: `${stats.memory.percentage}%` }"
          ></div>
        </div>
        <div
          class="text-[8px] opacity-30 font-bold uppercase tracking-widest text-right"
        >
          {{ formatBytes(stats.memory.used) }} /
          {{ formatBytes(stats.memory.total) }}
        </div>
      </div>

      <!-- Uptime & OS Info -->
      <div
        v-if="showUptime || showOSInfo"
        class="pt-2 border-t border-white/10 space-y-2"
      >
        <div v-if="showUptime" class="flex items-center space-x-2 opacity-50">
          <UIcon name="i-heroicons-clock" class="w-3.5 h-3.5" />
          <span class="text-[10px] font-bold uppercase tracking-tight">{{
            formatUptime(stats.uptime)
          }}</span>
        </div>
        <div v-if="showOSInfo" class="flex items-center space-x-2 opacity-30">
          <UIcon name="i-heroicons-computer-desktop" class="w-3.5 h-3.5" />
          <span class="text-[10px] font-bold uppercase tracking-tight"
            >{{ stats.os.platform }} {{ stats.os.release }}</span
          >
        </div>
      </div>
    </div>

    <div
      v-else-if="isLoading"
      class="flex items-center space-x-3 text-white/40"
    >
      <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin" />
      <span class="text-xs font-black uppercase tracking-[0.2em]">{{
        $t("modules.system-status.fetching")
      }}</span>
    </div>
  </BaseModule>
</template>

<script setup lang="ts">
import { BaseModule } from "../BaseModule";
import type { SystemStatusModuleConfig } from "./index";

const props = defineProps<SystemStatusModuleConfig>();

const stats = ref<any>(null);
const isLoading = ref(true);

const fetchStats = async () => {
  try {
    const data = await $fetch<any>("/api/system-info");
    stats.value = data;
  } catch (error) {
    console.error("Failed to fetch system stats:", error);
  } finally {
    isLoading.value = false;
  }
};

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const formatUptime = (seconds: number) => {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);

  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);

  return parts.join(" ") || "< 1m";
};

let timer: any = null;

const startTimer = () => {
  if (timer) clearInterval(timer);
  timer = setInterval(fetchStats, props.updateInterval || 5000);
};

onMounted(() => {
  fetchStats();
  startTimer();
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});

watch(() => props.updateInterval, startTimer);
</script>
