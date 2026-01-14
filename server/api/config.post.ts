import { defineEventHandler, readBody, createError } from "h3";
import { configManager } from "../utils/config";
import { backgroundController } from "../utils/backgroundController";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  console.log("[Server] API | POST /api/config");
  if (!body) {
    throw createError({
      statusCode: 400,
      statusMessage: "No configuration provided",
    });
  }

  try {
    // Basic validation: ensure it's an object and has required top-level keys
    if (typeof body !== "object" || !body.background || !body.modules) {
      throw new Error("Invalid configuration format");
    }

    configManager.updateConfig(body);

    // Notify the background controller that the config (and potentially the waiting list) has changed
    await backgroundController.reconfigure();
    backgroundController.notifyStateChange();

    // Broadcast the new configuration to all connected WebSocket clients
    const { broadcastConfig } = await import("./ws");
    broadcastConfig(body);

    return { success: true };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to save configuration: ${error.message}`,
    });
  }
});
