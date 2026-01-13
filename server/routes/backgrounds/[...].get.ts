import fs from "node:fs";
import path from "node:path";
import {
  defineEventHandler,
  createError,
  sendStream,
  setResponseHeader,
  setResponseStatus,
} from "h3";
import { getProjectPaths } from "../../utils/paths";

/**
 * Route: GET /backgrounds/*
 * Purpose: Serves the actual binary media files (images/videos) from the backgrounds directory.
 * This route supports partial content (streaming) for videos and long-term caching.
 */
export default defineEventHandler(async (event) => {
  // Extract the filename from the wildcard parameter
  const filename = event.context.params?._;

  if (!filename) {
    throw createError({
      statusCode: 400,
      statusMessage: "Filename is required",
    });
  }

  const { backgroundsDir } = getProjectPaths();
  // Ensure the filename is safe (prevents directory traversal attacks)
  const safeFilename = path.basename(filename);
  const dataPath = path.join(backgroundsDir, safeFilename);

  // Check if the file exists in the backgrounds directory
  if (fs.existsSync(dataPath)) {
    const stats = fs.statSync(dataPath);
    const fileSize = stats.size;
    const range = event.node.req.headers.range;

    // Set common headers for caching and range support
    setResponseHeader(event, "Accept-Ranges", "bytes");
    setResponseHeader(
      event,
      "Cache-Control",
      "public, max-age=31536000, immutable" // Cache for 1 year
    );

    // Handle HTTP Range requests (crucial for video streaming/seeking)
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize) {
        throw createError({
          statusCode: 416,
          statusMessage: "Requested range not satisfiable",
        });
      }

      const chunksize = end - start + 1;
      const file = fs.createReadStream(dataPath, { start, end });

      setResponseStatus(event, 206); // Partial Content
      setResponseHeader(
        event,
        "Content-Range",
        `bytes ${start}-${end}/${fileSize}`
      );
      setResponseHeader(event, "Content-Length", chunksize);
      setResponseHeader(event, "Content-Type", getContentType(safeFilename));

      return sendStream(event, file);
    } else {
      // Standard request (full file)
      setResponseHeader(event, "Content-Length", fileSize);
      setResponseHeader(event, "Content-Type", getContentType(safeFilename));
      return sendStream(event, fs.createReadStream(dataPath));
    }
  }

  // File not found
  throw createError({
    statusCode: 404,
    statusMessage: "Background not found",
  });
});

/**
 * Helper function to determine the MIME type based on file extension.
 * @param filename The name of the file.
 */
function getContentType(filename: string) {
  const ext = path.extname(filename).toLowerCase();
  const map: Record<string, string> = {
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".ogg": "video/ogg",
    ".mov": "video/quicktime",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
  };
  return map[ext] || "application/octet-stream";
}
