import { defineEventHandler, getQuery, createError } from "h3";
import fs from "node:fs";
import path from "node:path";
import { getProjectPaths } from "../../utils/paths";
import { backgroundController } from "../../utils/backgroundController";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const folder = query.folder as string;

  if (!folder) {
    throw createError({
      statusCode: 400,
      statusMessage: "Folder path is required",
    });
  }

  // Prevent deleting the root directory or navigating out of backgroundsDir
  if (folder === "root" || folder === "/" || folder === ".") {
    throw createError({
      statusCode: 400,
      statusMessage: "Root folder cannot be deleted",
    });
  }

  if (folder.includes("..")) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid folder path",
    });
  }

  const { backgroundsDir } = getProjectPaths();
  const targetPath = path.join(backgroundsDir, folder);

  try {
    // Check if the folder exists and is actually a directory
    try {
      const stats = await fs.promises.stat(targetPath);
      if (!stats.isDirectory()) {
         throw createError({
          statusCode: 400,
          statusMessage: "Target is not a directory",
        });
      }
    } catch (e: any) {
       if (e.statusCode === 400) throw e;
       throw createError({
        statusCode: 404,
        statusMessage: "Folder not found",
      });
    }

    // Delete the directory recursively
    await fs.promises.rm(targetPath, { recursive: true, force: true });

    // Refresh the background controller to remove the items from rotation
    await backgroundController.refreshMedia();
    backgroundController.notifyStateChange();

    return {
      success: true,
      message: "Folder deleted successfully",
    };
  } catch (err: any) {
    console.error("Error deleting folder:", err);
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || "Failed to delete folder",
    });
  }
});
