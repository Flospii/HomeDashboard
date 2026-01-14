import fs from "node:fs";
import path from "node:path";
import { exiftool } from "exiftool-vendored";
import { mapMetadata } from "./metadata";
import { getProjectPaths } from "./paths";
import { configManager } from "./config";
import type { BackgroundItem, DashboardConfig } from "../../app/types/config";

class BackgroundController {
  private currentMedia: BackgroundItem | null = null;
  private currentIndex: number = 0;
  private startTime: number = Date.now();
  private timer: NodeJS.Timeout | null = null;
  private allMedia: BackgroundItem[] = [];
  private waitingList: BackgroundItem[] = [];
  private onStateChange: (() => void) | null = null;
  private stateId: number = 0;
  private pollingTimer: NodeJS.Timeout | null = null;

  private readonly mediaExtensions = {
    image: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"],
    video: [".mp4", ".webm", ".ogg", ".mov"],
  };

  constructor() {
    this.init();
  }

  private async init() {
    console.log("[Server] BackgroundController | Initializing...");
    await this.reconfigure();
  }

  public async refreshMedia() {
    const { backgroundsDir } = getProjectPaths();
    const config = configManager.getConfig();

    const scanDir = (dir: string): BackgroundItem[] => {
      if (!fs.existsSync(dir)) return [];
      const files = fs.readdirSync(dir);
      const results: BackgroundItem[] = [];

      for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        let type: "image" | "video" | null = null;

        if (this.mediaExtensions.image.includes(ext)) {
          type = "image";
        } else if (this.mediaExtensions.video.includes(ext)) {
          type = "video";
        }

        if (type) {
          results.push({
            url: `/backgrounds/${file}`,
            type,
          });
        }
      }
      return results;
    };

    const localMedia = config.background.useLocalBackgrounds
      ? scanDir(backgroundsDir)
      : [];
    const externalMedia = (config.background.externalMediaUrlList || []).map(
      (m) => ({
        url: m.url,
        type: m.type,
      })
    );

    const newMedia = [...externalMedia, ...localMedia];

    // Check if media list actually changed to avoid redundant updates
    const hasChanged =
      this.allMedia.length !== newMedia.length ||
      this.allMedia.some((m, i) => m.url !== newMedia[i]?.url);

    if (hasChanged) {
      this.allMedia = newMedia;
      console.log(
        `[Server] BackgroundController | Media Refreshed | Total: ${this.allMedia.length} (Local: ${localMedia.length}, External: ${externalMedia.length})`
      );

      // Ensure currentMedia is still valid
      if (this.currentMedia) {
        const stillExists = this.allMedia.some(
          (m) => m.url === this.currentMedia?.url
        );
        if (!stillExists) {
          console.log(
            `[Server] BackgroundController | Current media ${this.currentMedia.url} no longer exists, skipping to next.`
          );
          this.currentMedia = null;
          await this.next();
        }
      } else if (this.allMedia.length > 0) {
        this.currentMedia = this.allMedia[0];
        this.notifyStateChange();
      }
    }
  }

  private startTimer() {
    if (this.timer) clearInterval(this.timer);
    const config = configManager.getConfig();
    const interval = config.background.interval || 30000;
    this.timer = setInterval(() => this.next(), interval);
  }

  private startPolling() {
    if (this.pollingTimer) clearInterval(this.pollingTimer);
    const config = configManager.getConfig();
    if (config.background.useLocalBackgrounds) {
      const interval = config.background.localPollingInterval || 30000;
      console.log(
        `[Server] BackgroundController | Starting local polling (${interval}ms)`
      );
      this.pollingTimer = setInterval(() => this.refreshMedia(), interval);
    }
  }

  public async reconfigure() {
    console.log("[Server] BackgroundController | Reconfiguring...");
    configManager.loadConfig(); // Ensure fresh config
    await this.refreshMedia();
    this.startTimer();
    this.startPolling();
  }

  private isNextRunning: boolean = false;

  public async next() {
    if (this.isNextRunning) return;
    this.isNextRunning = true;

    try {
      const config = configManager.getConfig();

      // Check waiting list
      if (this.waitingList.length > 0) {
        this.currentMedia = this.waitingList.shift()!;
      } else {
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

      this.stateId++;
      console.log(
        `[Server] BackgroundController | Next | picked ${this.currentMedia?.url} (stateId: ${this.stateId})`
      );

      await this.fetchMetadataForCurrent();

      this.startTime = Date.now();
      this.startTimer(); // Reset timer
      this.notifyStateChange();
    } finally {
      this.isNextRunning = false;
    }
  }

  private async fetchMetadataForCurrent() {
    if (
      !this.currentMedia ||
      !this.currentMedia.url ||
      !this.currentMedia.url.startsWith("/backgrounds/") ||
      this.currentMedia.metadata
    ) {
      return;
    }

    const { backgroundsDir } = getProjectPaths();
    const fileName = this.currentMedia.url.replace("/backgrounds/", "");
    const filePath = path.join(backgroundsDir, fileName);

    try {
      const stats = fs.statSync(filePath);
      const rawMeta = await exiftool.read(filePath);
      const ext = path.extname(fileName).toLowerCase();
      this.currentMedia.metadata = mapMetadata(rawMeta, {
        fileName,
        fileSize: stats.size,
        mimeType:
          this.currentMedia.type === "image"
            ? `image/${ext.slice(1).replace("jpg", "jpeg")}`
            : `video/${ext.slice(1)}`,
      });
    } catch (err) {
      console.error("Failed to fetch metadata in next():", err);
    }
  }

  public async getStatus() {
    const config = configManager.getConfig();
    const interval = config.background.interval || 30000;
    const transitionMode = config.background.transitionMode || "fade";

    const elapsed = Date.now() - this.startTime;
    const remaining = Math.max(0, interval - elapsed);

    // If currentMedia is null but we have media, trigger next()
    if (!this.currentMedia && this.allMedia.length > 0) {
      await this.next();
    }

    // Calculate next media for preloading
    let nextMedia: BackgroundItem | null = null;
    if (this.waitingList.length > 0) {
      nextMedia = this.waitingList[0];
    } else if (this.allMedia.length > 0) {
      const nextIndex = (this.currentIndex + 1) % this.allMedia.length;
      nextMedia = this.allMedia[nextIndex];
    }

    return {
      currentMedia: this.currentMedia,
      nextMedia: nextMedia
        ? { url: nextMedia.url, type: nextMedia.type }
        : null,
      remainingTime: remaining,
      transitionMode,
      totalInterval: interval,
      waitingList: this.waitingList,
      stateId: this.stateId,
    };
  }

  public addToWaitingList(item: BackgroundItem) {
    this.waitingList.push(item);
    console.log(
      `[Server] BackgroundController | Waiting List | Added: ${item.url} (Total: ${this.waitingList.length})`
    );
    this.notifyStateChange();
  }

  public removeFromWaitingList(index: number) {
    if (index >= 0 && index < this.waitingList.length) {
      const removed = this.waitingList.splice(index, 1)[0];
      console.log(
        `[Server] BackgroundController | Waiting List | Removed: ${removed.url} (Total: ${this.waitingList.length})`
      );
      this.notifyStateChange();
    }
  }

  public getAllMedia() {
    return this.allMedia;
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
