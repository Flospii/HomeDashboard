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
  // Ensure filename is just a name, not a path
  const safeFilename = path.basename(filename);
  const filePath = path.join(backgroundsDir, safeFilename);

  try {
    await fs.access(filePath);
    await fs.unlink(filePath);

    // Refresh the background controller to reflect the changes
    await backgroundController.refreshMedia();
    backgroundController.notifyStateChange();

    return { success: true, message: `Deleted ${safeFilename}` };
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
