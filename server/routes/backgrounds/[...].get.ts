import fs from "node:fs";
import path from "node:path";
import {
  defineEventHandler,
  createError,
  sendStream,
  setResponseHeader,
  setResponseStatus,
} from "h3";

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
    const stats = fs.statSync(dataPath);
    const fileSize = stats.size;
    const range = event.node.req.headers.range;

    // Set common headers
    setResponseHeader(event, "Accept-Ranges", "bytes");
    setResponseHeader(
      event,
      "Cache-Control",
      "public, max-age=31536000, immutable"
    );

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

      setResponseStatus(event, 206);
      setResponseHeader(
        event,
        "Content-Range",
        `bytes ${start}-${end}/${fileSize}`
      );
      setResponseHeader(event, "Content-Length", chunksize);
      setResponseHeader(event, "Content-Type", getContentType(safeFilename));

      return sendStream(event, file);
    } else {
      setResponseHeader(event, "Content-Length", fileSize);
      setResponseHeader(event, "Content-Type", getContentType(safeFilename));
      return sendStream(event, fs.createReadStream(dataPath));
    }
  }

  throw createError({
    statusCode: 404,
    statusMessage: "Background not found",
  });
});

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
