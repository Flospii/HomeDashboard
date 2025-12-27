import fs from "node:fs";
import path from "node:path";
import { defineEventHandler, readMultipartFormData, createError } from "h3";

export default defineEventHandler(async (event) => {
  const method = event.method;

  if (method !== "POST") {
    throw createError({
      statusCode: 405,
      statusMessage: "Method Not Allowed",
    });
  }

  const formData = await readMultipartFormData(event);
  if (!formData) {
    throw createError({
      statusCode: 400,
      statusMessage: "No files uploaded",
    });
  }

  const backgroundsDir = path.resolve(process.cwd(), "public/backgrounds");
  if (!fs.existsSync(backgroundsDir)) {
    fs.mkdirSync(backgroundsDir, { recursive: true });
  }

  const savedFiles = [];

  for (const item of formData) {
    if (item.filename && item.data) {
      const filePath = path.join(backgroundsDir, item.filename);
      fs.writeFileSync(filePath, item.data);

      const ext = path.extname(item.filename).toLowerCase();
      const mediaExtensions = {
        image: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"],
        video: [".mp4", ".webm", ".ogg", ".mov"],
      };

      let type: "image" | "video" | null = null;
      if (mediaExtensions.image.includes(ext)) {
        type = "image";
      } else if (mediaExtensions.video.includes(ext)) {
        type = "video";
      }

      if (type) {
        savedFiles.push({
          url: `/backgrounds/${item.filename}`,
          type,
        });
      }
    }
  }

  return savedFiles;
});
