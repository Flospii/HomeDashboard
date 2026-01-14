import fs from "node:fs";
import { getProjectPaths } from "./paths";
import type { DashboardConfig } from "../../app/types/config";

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

  public updateConfig(newConfig: DashboardConfig) {
    const { configFile, dataDir } = getProjectPaths();
    try {
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(configFile, JSON.stringify(newConfig, null, 2), "utf-8");
      this.config = newConfig;
      console.log("[Server] ConfigManager | Config updated and saved");
    } catch (e) {
      console.error("[Server] ConfigManager | Failed to save config", e);
      throw e;
    }
  }
}

export const configManager = new ConfigManager();
