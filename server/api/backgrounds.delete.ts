import { defineEventHandler, getQuery, createError } from "h3";
import fs from "fs/promises";
import path from "path";
import { getProjectPaths } from "../utils/paths";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const filename = query.filename as string;

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
