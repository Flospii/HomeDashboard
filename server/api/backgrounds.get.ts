import fs from "node:fs";
import path from "node:path";
import { defineEventHandler } from "h3";
import { exiftool } from "exiftool-vendored";
import { mapMetadata } from "../utils/metadata";
import { getProjectPaths } from "../utils/paths";

/**
 * API Endpoint: GET /api/backgrounds
 * Purpose: Scans the local backgrounds directory and returns a list of all available media files with their metadata.
 */
export default defineEventHandler(async () => {
  const { backgroundsDir, configFile } = getProjectPaths();

  // Load config to get external URLs
  let config: any = { background: { externalMediaUrlList: [] } };
  try {
    if (fs.existsSync(configFile)) {
      config = JSON.parse(fs.readFileSync(configFile, "utf-8"));
    }
  } catch (e) {
    console.error("Failed to load config in backgrounds.get.ts", e);
  }

  // Supported file extensions for images and videos
  const mediaExtensions = {
    image: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"],
    video: [".mp4", ".webm", ".ogg", ".mov"],
  };

  /**
   * Recursively scans a directory for media files.
   * @param dir The absolute path to the directory to scan.
   */
  const scanDir = async (dir: string) => {
    if (!fs.existsSync(dir)) return [];
    const files = fs.readdirSync(dir);
    const results = [];

    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      let type: "image" | "video" | null = null;

      // Determine media type based on extension
      if (mediaExtensions.image.includes(ext)) {
        type = "image";
      } else if (mediaExtensions.video.includes(ext)) {
        type = "video";
      }

      if (type) {
        // Construct the media item object with only essential info
        results.push({
          url: `/backgrounds/${file}`,
          type,
        });
      }
    }
    return results;
  };

  // Perform the scan and return the list of files
  const localMedia = config.background.useLocalBackgrounds
    ? await scanDir(backgroundsDir)
    : [];
  const externalMedia = (config.background.externalMediaUrlList || []).map(
    (m: any) => ({
      url: m.url,
      type: m.type,
    })
  );

  return [...externalMedia, ...localMedia];
});
