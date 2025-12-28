import fs from "node:fs";
import path from "node:path";
import { defineEventHandler, readBody, createError } from "h3";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  if (!body) {
    throw createError({
      statusCode: 400,
      statusMessage: "No configuration provided",
    });
  }

  const configPath = path.resolve(process.cwd(), "public/config.json");

  try {
    // Basic validation: ensure it's an object and has required top-level keys
    if (typeof body !== "object" || !body.background || !body.modules) {
      throw new Error("Invalid configuration format");
    }

    fs.writeFileSync(configPath, JSON.stringify(body, null, 2), "utf-8");
    return { success: true };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to save configuration: ${error.message}`,
    });
  }
});
