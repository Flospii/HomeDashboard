import fs from "node:fs";
import path from "node:path";
import { defineEventHandler, readMultipartFormData, createError } from "h3";
import { getProjectPaths } from "../utils/paths";
import { backgroundController } from "../utils/backgroundController";

export default defineEventHandler(async (event) => {
  const formData = await readMultipartFormData(event);
  console.log(
    `[Server] API | POST /api/backgrounds | Files: ${formData?.length || 0}`
  );
  if (!formData) {
    throw createError({
      statusCode: 400,
      statusMessage: "No files uploaded",
    });
  }

  const { backgroundsDir } = getProjectPaths();
  if (!fs.existsSync(backgroundsDir)) {
    fs.mkdirSync(backgroundsDir, { recursive: true });
  }

  for (const item of formData) {
    if (item.filename && item.data) {
      const filePath = path.join(backgroundsDir, item.filename);
      fs.writeFileSync(filePath, item.data);
    }
  }

  // Refresh the background controller to reflect the new files
  await backgroundController.refreshMedia();
  backgroundController.notifyStateChange();

  return { success: true };
});
