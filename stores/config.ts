import { defineStore } from "pinia";
import type {
  DashboardConfig,
  BackgroundItem,
  ModulePosition,
} from "../app/types/config";

export const useConfigStore = defineStore("config", () => {
  const config = ref<DashboardConfig | null>(null);
  const localBackgrounds = ref<BackgroundItem[]>([]);
  const isLoading = ref(true);
  const error = ref<string | null>(null);
  const currentBackgroundIndex = ref(0);
  let pollingTimer: any = null;

  const allBackgrounds = computed(() => {
    if (!config.value) return [];
    const staticMedia = config.value.background.externalMediaUrlList || [];
    return [...staticMedia, ...localBackgrounds.value];
  });

  const currentBackground = computed(() => {
    return allBackgrounds.value[currentBackgroundIndex.value] || null;
  });

  const fetchLocalBackgrounds = async () => {
    if (!config.value?.background?.useLocalBackgrounds) {
      localBackgrounds.value = [];
      return;
    }

    try {
      const data = await $fetch<BackgroundItem[]>("/api/backgrounds");
      if (Array.isArray(data)) {
        localBackgrounds.value = data;
      }
    } catch (err) {
      console.error("Error fetching local backgrounds:", err);
    }
  };

  const startPolling = () => {
    stopPolling();
    const interval = config.value?.background?.localPollingInterval || 30000;
    pollingTimer = setInterval(fetchLocalBackgrounds, interval);
  };

  const stopPolling = () => {
    if (pollingTimer) {
      clearInterval(pollingTimer);
      pollingTimer = null;
    }
  };

  const fetchConfig = async () => {
    try {
      isLoading.value = true;
      await refreshConfig();
    } catch (err: any) {
      error.value = err.message;
      console.error("Error loading dashboard config:", err);
    } finally {
      isLoading.value = false;
    }
  };

  const refreshConfig = async () => {
    try {
      const data = await $fetch<DashboardConfig>("/api/config");

      // Use a cleaner comparison or just update if fetching anyway
      // For now, simple deep comparison persists to avoid jitter
      if (JSON.stringify(config.value) !== JSON.stringify(data)) {
        if (!config.value) {
          config.value = data;
        } else {
          // Merge top level properties to preserve object reference if possible
          // but for DashboardConfig, a replacement is often safer for complex nested items.
          // Let's at least ensure we don't trigger if it's identical.
          Object.assign(config.value, data);
        }
        await fetchLocalBackgrounds();

        if (data.background?.useLocalBackgrounds) {
          startPolling();
        } else {
          stopPolling();
        }
      }
    } catch (err) {
      console.error("Error refreshing dashboard config:", err);
    }
  };

  let configPollingTimer: any = null;

  const startConfigPolling = (interval = 5000) => {
    stopConfigPolling();
    configPollingTimer = setInterval(refreshConfig, interval);
  };

  const stopConfigPolling = () => {
    if (configPollingTimer) {
      clearInterval(configPollingTimer);
      configPollingTimer = null;
    }
  };

  const saveConfig = async () => {
    if (!config.value) return;

    try {
      const result = await $fetch("/api/config", {
        method: "POST",
        body: config.value,
      });

      return result;
    } catch (err) {
      console.error("Error saving dashboard config:", err);
      throw err;
    }
  };

  const getModulesAtPosition = (position: ModulePosition) => {
    if (!config.value) return [];
    return config.value.modules.filter(
      (m) => m.position === position && m.enabled
    );
  };

  const setBackgroundIndex = (index: number) => {
    currentBackgroundIndex.value = index;
  };

  return {
    config,
    allBackgrounds,
    isLoading,
    error,
    currentBackgroundIndex,
    currentBackground,
    fetchConfig,
    refreshConfig,
    startConfigPolling,
    stopConfigPolling,
    saveConfig,
    getModulesAtPosition,
    stopPolling,
    setBackgroundIndex,
  };
});
