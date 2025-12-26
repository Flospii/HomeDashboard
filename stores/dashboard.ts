import { defineStore } from "pinia";

export interface MediaItem {
  url: string;
  type: "image" | "video";
}

export interface ModuleConfig {
  id: string;
  module: string;
  position:
    | "top_left"
    | "top_center"
    | "top_right"
    | "middle_left"
    | "middle_center"
    | "middle_right"
    | "bottom_left"
    | "bottom_center"
    | "bottom_right";
  enabled: boolean;
  config: Record<string, any>;
}

export interface DashboardConfig {
  background: {
    media: MediaItem[];
    interval: number;
  };
  modules: ModuleConfig[];
}

export const useDashboardStore = defineStore("dashboard", () => {
  const config = ref<DashboardConfig | null>(null);
  const isLoading = ref(true);
  const error = ref<string | null>(null);

  const fetchConfig = async () => {
    try {
      isLoading.value = true;
      const response = await fetch("/config.json");
      if (!response.ok) {
        throw new Error("Failed to load config.json");
      }
      config.value = await response.json();
    } catch (err: any) {
      error.value = err.message;
      console.error("Error loading dashboard config:", err);
    } finally {
      isLoading.value = false;
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
    isLoading,
    error,
    fetchConfig,
    getModulesAtPosition,
  };
});
