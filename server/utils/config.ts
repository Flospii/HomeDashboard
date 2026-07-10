import type { DashboardConfig } from "../../app/types/config";
import { createDirectusClient } from "./directus";
import { readItem } from "@directus/sdk";

class ConfigManager {
  private config: DashboardConfig | null = null;
  private pollingTimer: NodeJS.Timeout | null = null;
  private onConfigChangeCallbacks: ((newConfig: DashboardConfig) => void)[] = [];
  
  // Default config used for first-time directus seeding
  private defaultConfig: DashboardConfig = {
    background: {
      interval: 6000,
      useLocalBackgrounds: true,
      localPollingInterval: 10000,
      transitionMode: "fade",
      playbackOrder: "random",
      videoPlaybackMode: "once",
      useAllFolders: true,
      enabledFolders: [],
    },
    language: "en",
    modules: [
      {
        id: "clock-1",
        module: "clock",
        position: "top_left",
        enabled: true,
        config: {
          displaySeconds: true,
        },
      },
      {
        id: "weather-1",
        module: "weather",
        position: "top_right",
        enabled: true,
        config: {
          weatherProvider: "openmeteo",
          type: "current",
          lat: 48.086,
          lon: 14.0433,
          showProvider: true,
          showWindSpeed: true,
          showHumidity: true,
          showSunriseSunset: true,
          showLocation: true,
          showForecast: true,
        },
      },
      {
        id: "news-1",
        module: "news",
        position: "bottom_center",
        enabled: true,
        config: {
          feeds: [
            {
              title: "Der Standard",
              url: "https://www.derstandard.at/rss",
            },
          ],
          showSourceTitle: true,
          showPublishDate: true,
          rotationInterval: 15000,
        },
      },
      {
        id: "bg-meta-1",
        module: "background-metadata",
        position: "bottom_right",
        enabled: true,
        config: {
          showFileName: false,
          showFileSize: false,
          showMimeType: false,
          showGPS: true,
          showCreatedAt: true,
          showModifiedAt: false,
        },
      },
      {
        id: "qrcode-1",
        module: "qrcode",
        position: "middle_center",
        enabled: false,
        config: {
          type: "media-upload",
          title: "Upload Media",
          showUrl: true,
        },
      },
      {
        id: "system-1",
        module: "system-status",
        position: "bottom_left",
        enabled: false,
        config: {
          showCPU: true,
          showMemory: true,
          showUptime: true,
          showOSInfo: false,
          updateInterval: 5000,
        },
      },
    ],
  };

  constructor() {
    this.config = this.defaultConfig;
  }

  public getConfig(): DashboardConfig {
    return this.config || this.defaultConfig;
  }

  public async fetchFromDirectus(): Promise<DashboardConfig> {
    const maxRetries = 10;
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        const client = createDirectusClient();
        const data = await client.request(readItem('dashboard_config', '1')) as any;
        
        if (data) {
          if (typeof data.background === 'string') {
            try { data.background = JSON.parse(data.background); } catch (e) {}
          }
          if (typeof data.modules === 'string') {
            try { data.modules = JSON.parse(data.modules); } catch (e) {}
          }
          this.config = data;
          return this.config!;
        }
        throw new Error("Invalid response from Directus: No data returned");
      } catch (e: any) {
        const msg = (e.message || e || "").toString();
        retries++;
        if (retries < maxRetries) {
          console.log(`[Server] ConfigManager | Failed to fetch config (Attempt ${retries}/${maxRetries}), retrying in 5s... Error: ${msg}`);
          await new Promise(resolve => setTimeout(resolve, 5000));
          continue;
        }
        
        console.error("[Server] ConfigManager | Failed to fetch config from Directus after max retries, using default/memory cache:", msg);
        return this.getConfig();
      }
    }
    return this.getConfig();
  }

  public startPolling(intervalMs: number = 10000) {
    if (this.pollingTimer) clearInterval(this.pollingTimer);
    
    console.log(`[Server] ConfigManager | Starting background config polling (${intervalMs}ms)`);
    this.pollingTimer = setInterval(async () => {
      try {
        const client = createDirectusClient();
        const data = await client.request(readItem('dashboard_config', '1')) as any;
        
        if (data) {
          if (typeof data.background === 'string') {
            try { data.background = JSON.parse(data.background); } catch (e) {}
          }
          if (typeof data.modules === 'string') {
            try { data.modules = JSON.parse(data.modules); } catch (e) {}
          }
          
          const newConfigStr = JSON.stringify(data);
          const oldConfigStr = JSON.stringify(this.config);
          
          if (newConfigStr !== oldConfigStr) {
            console.log("[Server] ConfigManager | Remote configuration changed!");
            this.config = data;
            this.onConfigChangeCallbacks.forEach(cb => cb(this.config!));
          }
        }
      } catch (err: any) {
        // Silently ignore polling errors so we don't spam the console if Directus temporarily goes down
      }
    }, intervalMs);
  }

  public onConfigChange(callback: (newConfig: DashboardConfig) => void) {
    this.onConfigChangeCallbacks.push(callback);
  }

  public updateConfig(newConfig: DashboardConfig) {
    this.config = newConfig;
    console.log("[Server] ConfigManager | In-memory Config updated");
  }
}

export const configManager = new ConfigManager();
