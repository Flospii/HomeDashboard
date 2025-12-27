import fs from "node:fs";
import path from "node:path";
import { defineEventHandler } from "h3";

export default defineEventHandler(async (event) => {
  const mediaDir = path.resolve(process.cwd(), "public/backgrounds");

  if (!fs.existsSync(mediaDir)) {
    return [];
  }

  const files = fs.readdirSync(mediaDir);
  const mediaExtensions = {
    image: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"],
    video: [".mp4", ".webm", ".ogg", ".mov"],
  };

  const mediaFiles = files
    .map((file) => {
      const ext = path.extname(file).toLowerCase();
      let type: "image" | "video" | null = null;

      if (mediaExtensions.image.includes(ext)) {
        type = "image";
      } else if (mediaExtensions.video.includes(ext)) {
        type = "video";
      }

      if (type) {
        return {
          url: `/backgrounds/${file}`,
          type,
        };
      }
      return null;
    })
    .filter(Boolean);

  return mediaFiles;
});
