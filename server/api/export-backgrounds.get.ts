import fs from "node:fs";
import path from "node:path";
import { defineEventHandler, setResponseHeader, sendStream, getQuery } from "h3";
import archiver from "archiver";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const folder = query.folder as string | undefined;

  let dataDir = path.resolve(process.cwd(), "data/backgrounds");
  
  if (folder && folder !== "root") {
    // Basic path traversal prevention
    if (folder.includes("..")) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid folder path",
      });
    }
    dataDir = path.join(dataDir, path.normalize(folder));
    
    // Check if the explicitly requested folder exists
    try {
      await fs.promises.access(dataDir);
    } catch {
       throw createError({
        statusCode: 404,
        statusMessage: "Folder not found",
      });
    }
  }

  const archive = archiver("zip", {
    zlib: { level: 9 }, // Sets the compression level.
  });

  const zipFilename = folder && folder !== "root" 
    ? `${folder.replace(/[\/\\]/g, "_")}.zip` 
    : "backgrounds.zip";

  // Set headers for download
  setResponseHeader(event, "Content-Type", "application/zip");
  setResponseHeader(
    event,
    "Content-Disposition",
    `attachment; filename="${zipFilename}"`
  );

  // archive.directory handles recursive adding of the folder contents
  // The 'false' parameter means it will put the contents directly in the root of the zip, 
  // not nested inside a folder with the same name.
  if (fs.existsSync(dataDir)) {
      archive.directory(dataDir, false);
  }

  // Finalize the archive
  archive.finalize();

  return sendStream(event, archive);
});
