import fs from "node:fs";
import path from "node:path";
import { defineEventHandler, createError, sendStream } from "h3";

export default defineEventHandler(async (event) => {
  const filename = event.context.params?._;
  if (!filename) {
    throw createError({
      statusCode: 400,
      statusMessage: "Filename is required",
    });
  }

  const safeFilename = path.basename(filename);
  const dataPath = path.resolve(
    process.cwd(),
    "data/backgrounds",
    safeFilename
  );
  // Try persistent data directory
  if (fs.existsSync(dataPath)) {
    return sendStream(event, fs.createReadStream(dataPath));
  }

  throw createError({
    statusCode: 404,
    statusMessage: "Background not found",
  });
});
