import { defineEventHandler, readBody, createError } from "h3";
import fs from "fs/promises";
import path from "path";
import { getProjectPaths } from "../../utils/paths";
import { backgroundController } from "../../utils/backgroundController";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { oldName, newName } = body;

  console.log(
    `[Server] API | PUT /api/backgrounds/folders | Renaming "${oldName}" to "${newName}"`,
  );

  if (!oldName || !newName) {
    throw createError({
      statusCode: 400,
      statusMessage: "oldName and newName are required",
    });
  }

  // Basic validation to prevent directory traversal
  if (
    newName.includes("..") ||
    newName.includes("/") ||
    newName.includes("\\")
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid new folder name",
    });
  }

  const { backgroundsDir } = getProjectPaths();
  const oldPath = path.join(backgroundsDir, oldName);
  const newPath = path.join(backgroundsDir, newName);

  try {
    // Check if old folder exists
    await fs.access(oldPath);

    // Check if new folder name already exists
    try {
      await fs.access(newPath);
      throw createError({
        statusCode: 409,
        statusMessage: "Target folder already exists",
      });
    } catch (err: any) {
      if (err.statusCode === 409) throw err;
      // ENOENT is what we want here
    }

    // Perform rename
    await fs.rename(oldPath, newPath);

    // Refresh background controller
    await backgroundController.refreshMedia();
    backgroundController.notifyStateChange();

    return {
      success: true,
      message: `Folder renamed from ${oldName} to ${newName}`,
    };
  } catch (error: any) {
    if (error.statusCode) throw error;

    console.error("[Server] Error renaming folder:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to rename folder",
    });
  }
});
