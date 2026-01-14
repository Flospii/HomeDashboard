import { defineEventHandler, createError } from "h3";
import { configManager } from "../utils/config";

export default defineEventHandler(async () => {
  try {
    return configManager.getConfig();
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to read configuration: ${error.message}`,
    });
  }
});
