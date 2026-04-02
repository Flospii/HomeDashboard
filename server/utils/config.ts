import fs from "node:fs";
import { getProjectPaths } from "./paths";
import type { DashboardConfig } from "../../app/types/config";

const DIRECTUS_URL = process.env.DIRECTUS_URL || "http://localhost:8055";

class ConfigManager {
  private config: DashboardConfig | null = null;

  constructor() {
    this.init();
  }

  private init() {
    const { configFile, defaultConfigFile, dataDir } = getProjectPaths();

    if (!fs.existsSync(configFile)) {
      if (fs.existsSync(defaultConfigFile)) {
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }
        fs.copyFileSync(defaultConfigFile, configFile);
        console.log("[Server] ConfigManager | Initialized from default config");
      }
    }
    this.loadConfig();
  }

  public loadConfig(): DashboardConfig {
    const { configFile } = getProjectPaths();
    try {
      const data = fs.readFileSync(configFile, "utf-8");
      this.config = JSON.parse(data);
      return this.config!;
    } catch (e) {
      console.error("[Server] ConfigManager | Failed to load config", e);
      throw e;
    }
  }

  public getConfig(): DashboardConfig {
    if (!this.config) {
      return this.loadConfig();
    }
    return this.config;
  }

  public async fetchFromDirectus(): Promise<DashboardConfig> {
    try {
      const headers: Record<string, string> = {};
      if (process.env.DIRECTUS_SERVER_TOKEN) {
        headers["Authorization"] = `Bearer ${process.env.DIRECTUS_SERVER_TOKEN}`;
      }
      
      const res = await fetch(`${DIRECTUS_URL}/items/dashboard_config/1`, { headers });
      const json = await res.json();
      
      if (json && json.data && !json.errors) {
        const data = json.data;
        // Safety parse for JSON fields that might arrive as strings
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
      console.error("[Server] ConfigManager | Failed to fetch config from Directus, falling back to local cache/file:", e);
      return this.getConfig();
    }
  }

  public updateConfig(newConfig: DashboardConfig) {
    const { configFile, dataDir } = getProjectPaths();
    try {
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(configFile, JSON.stringify(newConfig, null, 2), "utf-8");
      this.config = newConfig;
      console.log("[Server] ConfigManager | Local fallback Config updated and saved");
    } catch (e) {
      console.error("[Server] ConfigManager | Failed to save config locally", e);
      throw e;
    }
  }
}

export const configManager = new ConfigManager();
