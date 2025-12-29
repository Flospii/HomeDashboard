import fs from "node:fs";
import path from "node:path";
import { defineEventHandler, setResponseHeader, sendStream } from "h3";
import archiver from "archiver";

export default defineEventHandler(async (event) => {
  const dataDir = path.resolve(process.cwd(), "data/backgrounds");
  const publicDir = path.resolve(process.cwd(), "public/backgrounds");

  const archive = archiver("zip", {
    zlib: { level: 9 }, // Sets the compression level.
  });

  // Set headers for download
  setResponseHeader(event, "Content-Type", "application/zip");
  setResponseHeader(
    event,
    "Content-Disposition",
    'attachment; filename="backgrounds.zip"'
  );

  const addFilesFromDir = (dir: string) => {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isFile()) {
          // Add file to archive, use filename as name in zip
          archive.file(filePath, { name: file });
        }
      }
    }
  };

  // Add files from both directories
  // Note: If files have the same name, the last one added will overwrite in the zip
  // which is fine as we deduplicate in the UI anyway
  addFilesFromDir(publicDir);
  addFilesFromDir(dataDir);

  // Finalize the archive
  archive.finalize();

  return sendStream(event, archive);
});
