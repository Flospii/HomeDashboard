import fs from "node:fs";
import path from "node:path";
import { defineEventHandler, createError } from "h3";

export default defineEventHandler(async () => {
  const dataDir = path.resolve(process.cwd(), "data");
  const dataPath = path.join(dataDir, "config.json");
  const defaultPath = path.resolve(process.cwd(), "defaults/config.json");

  // 1. If data/config.json doesn't exist, try to initialize it from defaults
  if (!fs.existsSync(dataPath)) {
    if (fs.existsSync(defaultPath)) {
      // Ensure data directory exists
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      // Copy default config to data directory
      fs.copyFileSync(defaultPath, dataPath);
    } else {
      throw createError({
        statusCode: 404,
        statusMessage: "Default configuration file not found",
      });
    }
  }

  // 2. Read and return the persistent configuration
  try {
    const config = fs.readFileSync(dataPath, "utf-8");
    return JSON.parse(config);
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to read configuration: ${error.message}`,
    });
  }
});
