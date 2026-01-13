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
  const serverBackground = ref<BackgroundItem | null>(null);
  const serverRemainingTime = ref(0);
  const serverTransitionMode = ref("fade");
  let pollingTimer: any = null;
  let ws: WebSocket | null = null;

  const allBackgrounds = computed(() => {
    if (!config.value) return [];
    const staticMedia = config.value.background.externalMediaUrlList || [];
    return [...staticMedia, ...localBackgrounds.value];
  });

  const waitingList = computed(() => {
    return config.value?.background?.waitingList || [];
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
      (m) => m.position === position && m.enabled
    );
  };

  const setBackgroundIndex = (index: number) => {
    currentBackgroundIndex.value = index;
  };

  const fetchBackgroundStatus = async () => {
    try {
      const status = await $fetch<any>("/api/background/status");
      serverBackground.value = status.currentMedia;
      serverRemainingTime.value = status.remainingTime;
      serverTransitionMode.value = status.transitionMode;

      // Sync currentBackgroundIndex
      if (status.currentMedia) {
        const index = allBackgrounds.value.findIndex(
          (b) => b.url === status.currentMedia.url
        );
        if (index !== -1) {
          currentBackgroundIndex.value = index;
        }
      }

      // Update waiting list in config if it exists
      if (config.value && status.waitingList) {
        config.value.background.waitingList = status.waitingList;
      }
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
          serverRemainingTime.value = status.remainingTime;
          serverTransitionMode.value = status.transitionMode;

          // Sync currentBackgroundIndex if the new background is in allBackgrounds
          if (status.currentMedia) {
            const index = allBackgrounds.value.findIndex(
              (b) => b.url === status.currentMedia.url
            );
            if (index !== -1) {
              currentBackgroundIndex.value = index;
            }
          }

          if (config.value && status.waitingList) {
            config.value.background.waitingList = status.waitingList;
          }
        } else if (message.type === "config") {
          // Update the configuration instantly when pushed from the server
          if (JSON.stringify(config.value) !== JSON.stringify(message.data)) {
            config.value = message.data;
            fetchLocalBackgrounds();
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

  const triggerPreviousBackground = async () => {
    try {
      await $fetch<any>("/api/background/previous", {
        method: "POST",
      });
      // WebSocket will handle the state update
    } catch (err) {
      console.error("Error triggering previous background:", err);
    }
  };

  const addToWaitingList = async (item: BackgroundItem) => {
    if (!config.value) return;
    if (!config.value.background.waitingList) {
      config.value.background.waitingList = [];
    }
    config.value.background.waitingList.push(item);
    await saveConfig();
  };

  const removeFromWaitingList = async (index: number) => {
    if (!config.value?.background.waitingList) return;
    config.value.background.waitingList.splice(index, 1);
    await saveConfig();
  };

  const popNextFromWaitingList = async () => {
    if (
      !config.value?.background.waitingList ||
      config.value.background.waitingList.length === 0
    )
      return null;
    const item = config.value.background.waitingList.shift();
    await saveConfig();
    return item;
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
    waitingList,
    addToWaitingList,
    removeFromWaitingList,
    popNextFromWaitingList,
    serverBackground,
    serverRemainingTime,
    serverTransitionMode,
    fetchBackgroundStatus,
    startStatusPolling,
    stopStatusPolling,
    triggerNextBackground,
    triggerPreviousBackground,
  };
});
