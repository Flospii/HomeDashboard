import fs from "node:fs";
import path from "node:path";
import { defineEventHandler } from "h3";

export default defineEventHandler(async () => {
  const configPath = path.resolve(process.cwd(), "public/config.json");
  const examplePath = path.resolve(process.cwd(), "public/config.example.json");

  if (fs.existsSync(configPath)) {
    const config = fs.readFileSync(configPath, "utf-8");
    return JSON.parse(config);
  }

  if (fs.existsSync(examplePath)) {
    const example = fs.readFileSync(examplePath, "utf-8");
    return JSON.parse(example);
  }

  return {
    background: {
      externalMediaUrlList: [],
      interval: 5000,
    },
    modules: [],
  };
});
