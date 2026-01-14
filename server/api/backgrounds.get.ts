import { defineEventHandler } from "h3";
import { backgroundController } from "../utils/backgroundController";

/**
 * API Endpoint: GET /api/backgrounds
 * Purpose: Returns a list of all available media files with their metadata from the controller's cache.
 */
export default defineEventHandler(async () => {
  // Ensure the controller has scanned the directory at least once
  let allMedia = backgroundController.getAllMedia();

  if (allMedia.length === 0) {
    await backgroundController.refreshMedia();
    allMedia = backgroundController.getAllMedia();
  }

  return allMedia;
});
