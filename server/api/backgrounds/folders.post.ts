import fs from "node:fs";
import path from "node:path";
import { defineEventHandler, readBody } from "h3";
import { getProjectPaths } from "../../utils/paths";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { name, parent } = body;

  if (!name || typeof name !== "string") {
    throw createError({
      statusCode: 400,
      statusMessage: "Folder name is required",
    });
  }

  // Basic path traversal prevention
  if (name.includes("..") || name.includes("/") || name.includes("\\")) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid folder name",
    });
  }

  const { backgroundsDir } = getProjectPaths();
  
  // Construct path safely
  let targetPath = backgroundsDir;
  
  if (parent && parent !== "root") {
    // Basic path traversal prevention for parent
    if (parent.includes("..")) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid parent folder path",
      });
    }
    // Prevent creating outside of backgroundsDir
    const normalizedParent = path.normalize(parent);
    targetPath = path.join(backgroundsDir, normalizedParent);
    
    // Ensure the parent exists
    try {
      await fs.promises.access(targetPath);
    } catch {
       throw createError({
        statusCode: 404,
        statusMessage: "Parent folder not found",
      });
    }
  }

  const newFolderPath = path.join(targetPath, name);

  try {
    // Check if folder already exists
    try {
      await fs.promises.access(newFolderPath);
      throw createError({
        statusCode: 409,
        statusMessage: "Folder already exists",
      });
    } catch (e: any) {
      if (e.statusCode === 409) throw e;
      // It doesn't exist, which is what we want
    }

    // Create the directory recursively just in case
    await fs.promises.mkdir(newFolderPath, { recursive: true });

    return {
      success: true,
      message: "Folder created successfully",
    };
  } catch (err: any) {
    console.error("Error creating folder:", err);
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || "Failed to create folder",
    });
  }
});
