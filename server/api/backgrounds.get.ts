import { defineEventHandler } from "h3";
import { backgroundController } from "../utils/backgroundController";

/**
 * API Endpoint: GET /api/backgrounds
 * Purpose: Returns a list of all available media files from the background controller.
 */
export default defineEventHandler(async () => {
  return backgroundController.getAllMedia();
});
