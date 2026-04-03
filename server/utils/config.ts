import type { DashboardConfig } from "../../app/types/config";

const DIRECTUS_URL = process.env.DIRECTUS_URL || "http://localhost:8055";
const DIRECTUS_INTERNAL_URL = process.env.DIRECTUS_INTERNAL_URL || DIRECTUS_URL;

class ConfigManager {
  private config: DashboardConfig | null = null;
  
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
    try {
      const headers: Record<string, string> = {};
      if (process.env.DIRECTUS_SERVER_TOKEN) {
        headers["Authorization"] = `Bearer ${process.env.DIRECTUS_SERVER_TOKEN}`;
      }
      
      const res = await fetch(`${DIRECTUS_INTERNAL_URL}/items/dashboard_config/1`, { headers });
      const json = await res.json();
      
      if (json && json.data && !json.errors) {
        const data = json.data;
        if (typeof data.background === 'string') {
          try { data.background = JSON.parse(data.background); } catch (e) {}
        }
        if (typeof data.modules === 'string') {
          try { data.modules = JSON.parse(data.modules); } catch (e) {}
        }
        this.config = data;
        return this.config!;
      }
      throw new Error(json.errors ? json.errors[0].message : "Invalid response from Directus");
    } catch (e) {
      console.error("[Server] ConfigManager | Failed to fetch config from Directus, using default/memory cache:", e);
      return this.getConfig();
    }
  }

  public updateConfig(newConfig: DashboardConfig) {
    this.config = newConfig;
    console.log("[Server] ConfigManager | In-memory Config updated");
  }
}

export const configManager = new ConfigManager();
