import { defineStore } from "pinia";
import type {
  DashboardConfig,
  BackgroundItem,
  ModulePosition,
} from "../app/types/config";

export const useConfigStore = defineStore("config", () => {
  const config = ref<DashboardConfig | null>(null);
  const isLoading = ref(true);
  const error = ref<string | null>(null);
  const serverBackground = ref<BackgroundItem | null>(null);
  const serverNextBackground = ref<BackgroundItem | null>(null);
  const serverWaitingList = ref<BackgroundItem[]>([]);
  const serverRemainingTime = ref(0);
  const serverTransitionMode = ref("fade");
  const serverStateId = ref(0);
  const serverIsPaused = ref(false);
  let ws: WebSocket | null = null;

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
      }
    } catch (err) {
      console.error("Error refreshing dashboard config:", err);
    }
  };

  let configPollingTimer: any = null;

  const startConfigPolling = (interval = 30000) => {
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
      (m) => m.position === position && m.enabled,
    );
  };

  const fetchBackgroundStatus = async () => {
    try {
      const status = await $fetch<any>("/api/background/status");
      serverBackground.value = status.currentMedia;
      serverNextBackground.value = status.nextMedia;
      serverWaitingList.value = status.waitingList || [];
      serverRemainingTime.value = status.remainingTime;
      serverTransitionMode.value = status.transitionMode;
      serverStateId.value = status.stateId || 0;
      serverIsPaused.value = status.isPaused || false;
    } catch (err) {
      console.error("Error fetching background status:", err);
    }
  };

  const connectWebSocket = () => {
    if (ws || import.meta.server) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    ws = new WebSocket(`${protocol}//${host}/api/ws`);

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "status") {
          const status = message.data;
          serverBackground.value = status.currentMedia;
          serverNextBackground.value = status.nextMedia;
          serverWaitingList.value = status.waitingList || [];
          serverRemainingTime.value = status.remainingTime;
          serverTransitionMode.value = status.transitionMode;
          serverStateId.value = status.stateId || 0;
          serverIsPaused.value = status.isPaused || false;
        } else if (message.type === "config") {
          // Update the configuration instantly when pushed from the server
          if (JSON.stringify(config.value) !== JSON.stringify(message.data)) {
            config.value = message.data;
          }
        }
      } catch (e) {
        console.error("Error parsing WebSocket message:", e);
      }
    };

    ws.onclose = () => {
      ws = null;
      // Reconnect after a delay if not explicitly stopped
      setTimeout(() => {
        if (!ws) connectWebSocket();
      }, 3000);
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
      ws?.close();
    };
  };

  const startStatusPolling = () => {
    connectWebSocket();
    // Also do an initial fetch to be sure
    fetchBackgroundStatus();
  };

  const stopStatusPolling = () => {
    if (ws) {
      const socket = ws;
      ws = null; // Set to null first to prevent auto-reconnect
      socket.close();
    }
  };

  const triggerNextBackground = async () => {
    try {
      await $fetch<any>("/api/background/next", {
        method: "POST",
      });
      // We don't update refs here manually anymore,
      // because the WebSocket will broadcast the new state to all clients (including this one)
      // which ensures perfect synchronization and consistency.
    } catch (err) {
      console.error("Error triggering next background:", err);
    }
  };

  const togglePause = async () => {
    try {
      await $fetch<any>("/api/background/pause", {
        method: "POST",
      });
    } catch (err) {
      console.error("Error toggling pause:", err);
    }
  };

  const addToWaitingList = async (item: BackgroundItem) => {
    try {
      await $fetch("/api/background/waiting-list", {
        method: "POST",
        body: { action: "add", item },
      });
    } catch (err) {
      console.error("Error adding to waiting list:", err);
    }
  };

  const removeFromWaitingList = async (index: number) => {
    try {
      await $fetch("/api/background/waiting-list", {
        method: "POST",
        body: { action: "remove", index },
      });
    } catch (err) {
      console.error("Error removing from waiting list:", err);
    }
  };

  return {
    config,
    isLoading,
    error,
    fetchConfig,
    refreshConfig,
    startConfigPolling,
    stopConfigPolling,
    saveConfig,
    getModulesAtPosition,
    serverWaitingList,
    addToWaitingList,
    removeFromWaitingList,
    serverBackground,
    serverNextBackground,
    serverRemainingTime,
    serverTransitionMode,
    serverStateId,
    fetchBackgroundStatus,
    startStatusPolling,
    stopStatusPolling,
    triggerNextBackground,
    togglePause,
    serverIsPaused,
  };
});
