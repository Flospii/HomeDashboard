import fs from "node:fs";
import path from "node:path";
import { defineEventHandler } from "h3";
import exifr from "exifr";
import { mapMetadata } from "../utils/metadata";
import { getProjectPaths } from "../utils/paths";

export default defineEventHandler(async () => {
  const { backgroundsDir } = getProjectPaths();

  const mediaExtensions = {
    image: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"],
    video: [".mp4", ".webm", ".ogg", ".mov"],
  };

  const scanDir = async (dir: string) => {
    if (!fs.existsSync(dir)) return [];
    const files = fs.readdirSync(dir);
    const results = [];

    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      let type: "image" | "video" | null = null;

      if (mediaExtensions.image.includes(ext)) {
        type = "image";
      } else if (mediaExtensions.video.includes(ext)) {
        type = "video";
      }

      if (type) {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        const item: any = {
          url: `/backgrounds/${file}`,
          type,
        };

        let rawMeta = null;
        if (type === "image") {
          try {
            rawMeta = await exifr.parse(filePath, true);
          } catch (err) {
            console.error(`Error extracting metadata from ${file}:`, err);
          }
        }

        // Map metadata for both images and videos
        // For videos, rawMeta will be null, but mapMetadata will still fill in file info
        item.metadata = mapMetadata(rawMeta, {
          fileName: file,
          fileSize: stats.size,
          mimeType: `${type}/${ext.slice(1).replace("jpg", "jpeg")}`,
        });

        results.push(item);
      }
    }
    return results;
  };

  const dataFiles = await scanDir(backgroundsDir);

  return dataFiles;
});
