import fs from "node:fs";
import path from "node:path";
import { defineEventHandler, readMultipartFormData, createError } from "h3";

export default defineEventHandler(async (event) => {
  const formData = await readMultipartFormData(event);
  if (!formData) {
    throw createError({
      statusCode: 400,
      statusMessage: "No files uploaded",
    });
  }

  const backgroundsDir = path.resolve(process.cwd(), "data/backgrounds");
  if (!fs.existsSync(backgroundsDir)) {
    fs.mkdirSync(backgroundsDir, { recursive: true });
  }

  for (const item of formData) {
    if (item.filename && item.data) {
      const filePath = path.join(backgroundsDir, item.filename);
      fs.writeFileSync(filePath, item.data);
    }
  }

  return { success: true };
});
