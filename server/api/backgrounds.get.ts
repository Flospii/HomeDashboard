import fs from "node:fs";
import path from "node:path";
import { defineEventHandler } from "h3";

export default defineEventHandler(async () => {
  const dataDir = path.resolve(process.cwd(), "data/backgrounds");

  const mediaExtensions = {
    image: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"],
    video: [".mp4", ".webm", ".ogg", ".mov"],
  };

  const scanDir = (dir: string) => {
    if (!fs.existsSync(dir)) return [];
    return fs
      .readdirSync(dir)
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
  };

  const dataFiles = scanDir(dataDir);

  return dataFiles;
});
