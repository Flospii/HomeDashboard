import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { defineEventHandler, createError } from "h3";
import { getProjectPaths } from "../utils/paths";
import { backgroundController } from "../utils/backgroundController";
import busboy from "busboy";

export default defineEventHandler(async (event) => {
  console.log(`[Server] API | POST /api/backgrounds | Starting streaming upload`);

  const { backgroundsDir } = getProjectPaths();
  if (!fs.existsSync(backgroundsDir)) {
    fs.mkdirSync(backgroundsDir, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    try {
      const bb = busboy({ headers: event.node.req.headers });
      
      let subFolder = "";
      const tempFiles: { tmp: string; filename: string }[] = [];
      const filePromises: Promise<void>[] = [];

      bb.on("field", (name, val) => {
        if (name === "folder") {
          subFolder = val;
        }
      });

      bb.on("file", (name, file, info) => {
        const { filename } = info;
        if (!filename) {
          file.resume();
          return;
        }

        const tmpFilePath = path.join(os.tmpdir(), `bg_upload_${Date.now()}_${filename}`);
        tempFiles.push({ tmp: tmpFilePath, filename });

        const writeStream = fs.createWriteStream(tmpFilePath);
        
        const filePromise = new Promise<void>((res, rej) => {
          file.pipe(writeStream);
          file.on('end', () => res());
          writeStream.on('error', rej);
        });
        
        filePromises.push(filePromise);
      });

      bb.on("close", async () => {
        try {
          await Promise.all(filePromises);
          
          const targetDir =
            subFolder && subFolder !== "root"
              ? path.join(backgroundsDir, subFolder)
              : backgroundsDir;

          if (subFolder && subFolder !== "root" && !fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
          }

          // Move all files to target dir
          for (const { tmp, filename } of tempFiles) {
            const finalPath = path.join(targetDir, filename);
            // using copyFileSync and unlinkSync to move robustly across different partitions
            fs.copyFileSync(tmp, finalPath);
            fs.unlinkSync(tmp);
          }

          await backgroundController.refreshMedia();
          backgroundController.notifyStateChange();
          resolve({ success: true });
        } catch (err) {
          // Cleanup temp files on error
          for (const { tmp } of tempFiles) {
            if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
          }
          reject(err);
        }
      });

      bb.on("error", (err) => {
        reject(err);
      });

      event.node.req.pipe(bb);
    } catch (e) {
      reject(createError({ statusCode: 500, statusMessage: "Upload initialization failed" }));
    }
  });
});
