import fs from "node:fs";
import path from "node:path";
import { defineEventHandler, createError } from "h3";

export default defineEventHandler(async () => {
  const dataPath = path.resolve(process.cwd(), "data/config.json");
  const defaultPath = path.resolve(process.cwd(), "defaults/config.json");

  // 1. Try persistent data directory first
  if (fs.existsSync(dataPath)) {
    const config = fs.readFileSync(dataPath, "utf-8");
    return JSON.parse(config);
  }

  // 2. Try defaults directory (default/initial config)
  if (fs.existsSync(defaultPath)) {
    const config = fs.readFileSync(defaultPath, "utf-8");
    return JSON.parse(config);
  }

  throw createError({
    statusCode: 404,
    statusMessage: "Configuration file not found",
  });
});
