import fs from "node:fs";
import { defineEventHandler, createError } from "h3";
import { getProjectPaths } from "../utils/paths";

export default defineEventHandler(async () => {
  const { configFile, defaultConfigFile, dataDir } = getProjectPaths();

  // 1. If data/config.json doesn't exist, try to initialize it from defaults
  if (!fs.existsSync(configFile)) {
    if (fs.existsSync(defaultConfigFile)) {
      // Ensure data directory exists
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      // Copy default config to data directory
      fs.copyFileSync(defaultConfigFile, configFile);
    } else {
      throw createError({
        statusCode: 404,
        statusMessage: "Default configuration file not found",
      });
    }
  }

  // 2. Read and return the persistent configuration
  try {
    const config = fs.readFileSync(configFile, "utf-8");
    return JSON.parse(config);
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to read configuration: ${error.message}`,
    });
  }
});
