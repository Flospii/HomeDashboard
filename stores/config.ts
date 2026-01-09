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
      const response = await fetch("/api/backgrounds");
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          localBackgrounds.value = data;
        }
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
      const response = await fetch("/api/config");
      if (!response.ok) {
        throw new Error("Failed to load config");
      }
      const data = await response.json();

      // Only update if data has changed to avoid unnecessary re-renders
      if (JSON.stringify(config.value) !== JSON.stringify(data)) {
        config.value = data;
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
      const response = await fetch("/api/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config.value),
      });

      if (!response.ok) {
        throw new Error("Failed to save config");
      }

      return await response.json();
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
