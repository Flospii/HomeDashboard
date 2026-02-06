import { defineEventHandler, getQuery, createError } from "h3";
import fs from "fs/promises";
import path from "path";
import { getProjectPaths } from "../utils/paths";
import { backgroundController } from "../utils/backgroundController";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const filename = query.filename as string;

  console.log(`[Server] API | DELETE /api/backgrounds | Filename: ${filename}`);

  if (!filename) {
    throw createError({
      statusCode: 400,
      statusMessage: "Filename is required",
    });
  }

  const { backgroundsDir } = getProjectPaths();
  // Decode and sanitize path
  const decodedFilename = decodeURIComponent(filename);
  const normalizedPath = decodedFilename.replace(/\.\./g, "");
  const filePath = path.join(backgroundsDir, normalizedPath);

  try {
    await fs.access(filePath);
    await fs.unlink(filePath);

    // Refresh the background controller to reflect the changes
    await backgroundController.refreshMedia();
    backgroundController.notifyStateChange();

    return { success: true, message: `Deleted ${normalizedPath}` };
  } catch (error: any) {
    if (error.code === "ENOENT") {
      throw createError({
        statusCode: 404,
        statusMessage: "File not found",
      });
    }
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to delete file",
    });
  }
});
