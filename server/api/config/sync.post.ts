import { defineEventHandler, createError } from "h3";
import { configManager } from "../../utils/config";
import { backgroundController } from "../../utils/backgroundController";

export default defineEventHandler(async (event) => {
  console.log("[Server] API | POST /api/config/sync - Syncing from Directus");

  try {
    // Fetch the new config from Directus
    await configManager.fetchFromDirectus();

    // Reconfigure the background controller to pick up changes
    await backgroundController.reconfigure();
    backgroundController.notifyStateChange();

    // Broadcast the new configuration to connected clients
    const body = configManager.getConfig();
    const { broadcastConfig } = await import("../ws");
    broadcastConfig(body);

    return { success: true };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to sync configuration: ${error.message}`,
    });
  }
});
