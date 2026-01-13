import fs from "node:fs";
import path from "node:path";
import exifr from "exifr";
import { mapMetadata } from "./metadata";
import { getProjectPaths } from "./paths";
import type { BackgroundItem, DashboardConfig } from "../../app/types/config";

class BackgroundController {
  private currentMedia: BackgroundItem | null = null;
  private currentIndex: number = 0;
  private startTime: number = Date.now();
  private timer: NodeJS.Timeout | null = null;
  private allMedia: BackgroundItem[] = [];
  private history: BackgroundItem[] = [];
  private onStateChange: (() => void) | null = null;

  constructor() {
    this.init();
  }

  private async init() {
    await this.refreshMedia();
    this.startTimer();
  }

  private async refreshMedia() {
    const { backgroundsDir, configFile } = getProjectPaths();

    // Load config
    let config: DashboardConfig;
    try {
      config = JSON.parse(fs.readFileSync(configFile, "utf-8"));
    } catch (e) {
      console.error("Failed to load config in BackgroundController", e);
      return;
    }

    const mediaExtensions = {
      image: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"],
      video: [".mp4", ".webm", ".ogg", ".mov"],
    };

    const scanDir = async (dir: string) => {
      if (!fs.existsSync(dir)) return [];
      const files = fs.readdirSync(dir);
      const results: BackgroundItem[] = [];

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
          const item: BackgroundItem = {
            url: `/backgrounds/${file}`,
            type,
          };

          if (type === "image") {
            try {
              const rawMeta = await exifr.parse(filePath, true);
              item.metadata = mapMetadata(rawMeta, {
                fileName: file,
                fileSize: stats.size,
                mimeType: `image/${ext.slice(1).replace("jpg", "jpeg")}`,
              });
            } catch (err) {
              // Fallback
              item.metadata = mapMetadata(null, {
                fileName: file,
                fileSize: stats.size,
                mimeType: `image/${ext.slice(1).replace("jpg", "jpeg")}`,
              });
            }
          } else {
            item.metadata = mapMetadata(null, {
              fileName: file,
              fileSize: stats.size,
              mimeType: `video/${ext.slice(1)}`,
            });
          }

          results.push(item);
        }
      }
      return results;
    };

    const localMedia = config.background.useLocalBackgrounds
      ? await scanDir(backgroundsDir)
      : [];
    const externalMedia = config.background.externalMediaUrlList || [];

    this.allMedia = [...externalMedia, ...localMedia];

    if (!this.currentMedia && this.allMedia.length > 0) {
      this.currentMedia = this.allMedia[0];
    }
  }

  private startTimer() {
    if (this.timer) clearInterval(this.timer);

    const { configFile } = getProjectPaths();
    let interval = 30000;
    try {
      const config = JSON.parse(fs.readFileSync(configFile, "utf-8"));
      interval = config.background.interval || 30000;
    } catch (e) {}

    this.timer = setInterval(() => this.next(), interval);
  }

  public async next() {
    if (this.currentMedia) {
      this.history.push(this.currentMedia);
      if (this.history.length > 50) this.history.shift();
    }

    const { configFile } = getProjectPaths();
    let config: DashboardConfig;
    try {
      config = JSON.parse(fs.readFileSync(configFile, "utf-8"));
    } catch (e) {
      return;
    }

    // Check waiting list
    if (
      config.background.waitingList &&
      config.background.waitingList.length > 0
    ) {
      this.currentMedia = config.background.waitingList.shift()!;
      fs.writeFileSync(configFile, JSON.stringify(config, null, 2), "utf-8");
    } else {
      // We don't call refreshMedia() here to avoid double reading the config.
      // Instead, we use the already read config to determine the next media.
      // We only need to refresh allMedia if it's empty or we want to be absolutely sure.
      if (this.allMedia.length === 0) {
        await this.refreshMedia();
      }

      if (this.allMedia.length === 0) return;

      if (config.background.playbackOrder === "random") {
        this.currentIndex = Math.floor(Math.random() * this.allMedia.length);
      } else {
        this.currentIndex = (this.currentIndex + 1) % this.allMedia.length;
      }
      this.currentMedia = this.allMedia[this.currentIndex];
    }

    this.startTime = Date.now();
    this.startTimer(); // Reset timer
    this.notifyStateChange();
  }

  public getStatus() {
    const { configFile } = getProjectPaths();
    let interval = 30000;
    let transitionMode = "fade";
    let waitingList = [];

    try {
      const config = JSON.parse(fs.readFileSync(configFile, "utf-8"));
      interval = config.background.interval || 30000;
      transitionMode = config.background.transitionMode || "fade";
      waitingList = config.background.waitingList || [];
    } catch (e) {}

    const elapsed = Date.now() - this.startTime;
    const remaining = Math.max(0, interval - elapsed);

    return {
      currentMedia: this.currentMedia,
      remainingTime: remaining,
      transitionMode,
      totalInterval: interval,
      waitingList,
    };
  }

  public async previous() {
    if (this.history.length === 0) return;

    const item = this.history.pop()!;
    this.currentMedia = item;
    this.startTime = Date.now();
    this.startTimer(); // Reset timer
    this.notifyStateChange();
  }

  public setOnStateChange(cb: () => void) {
    this.onStateChange = cb;
  }

  public notifyStateChange() {
    if (this.onStateChange) {
      this.onStateChange();
    }
  }
}

export const backgroundController = new BackgroundController();
