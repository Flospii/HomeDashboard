import { defineStore } from "pinia";

export interface BackgroundItem {
  url: string;
  type: "image" | "video";
}

export const MODULE_POSITIONS = [
  "top_left",
  "top_center",
  "top_right",
  "middle_left",
  "middle_center",
  "middle_right",
  "bottom_left",
  "bottom_center",
  "bottom_right",
] as const;

export type ModulePosition = (typeof MODULE_POSITIONS)[number];

export interface ModuleConfig {
  id: string;
  module: string;
  position: ModulePosition;
  enabled: boolean;
  config: Record<string, any>;
}

export const TRANSITION_MODES = ["fade", "slide", "zoom", "blur"] as const;
export type TransitionMode = (typeof TRANSITION_MODES)[number];

export const PLAYBACK_MODES = ["sequential", "random"] as const;
export type PlaybackMode = (typeof PLAYBACK_MODES)[number];

export interface DashboardConfig {
  background: {
    externalMediaUrlList: BackgroundItem[];
    interval: number;
    useLocalBackgrounds?: boolean;
    localPollingInterval?: number;
    transitionMode?: TransitionMode;
    playbackOrder?: PlaybackMode;
  };
  modules: ModuleConfig[];
}

export const useDashboardStore = defineStore("dashboard", () => {
  const config = ref<DashboardConfig | null>(null);
  const localBackgrounds = ref<BackgroundItem[]>([]);
  const isLoading = ref(true);
  const error = ref<string | null>(null);
  let pollingTimer: any = null;

  const allBackgrounds = computed(() => {
    if (!config.value) return [];
    const staticMedia = config.value.background.externalMediaUrlList || [];
    return [...staticMedia, ...localBackgrounds.value];
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

  const getModulesAtPosition = (position: string) => {
    if (!config.value) return [];
    return config.value.modules.filter(
      (m) => m.position === position && m.enabled
    );
  };

  return {
    config,
    allBackgrounds,
    isLoading,
    error,
    fetchConfig,
    refreshConfig,
    startConfigPolling,
    stopConfigPolling,
    saveConfig,
    getModulesAtPosition,
    stopPolling,
  };
});
