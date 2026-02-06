import fs from "node:fs";
import path from "node:path";
import { ExifTool } from "exiftool-vendored";
import { mapMetadata } from "./metadata";
import { getProjectPaths } from "./paths";
import { configManager } from "./config";
import type {
  BackgroundItem,
  DashboardConfig,
  MediaType,
} from "../../app/types/config";

// Create a custom ExifTool instance with a timeout to prevent hanging
const exiftool = new ExifTool({
  taskTimeoutMillis: 5000,
  logger: () => console,
});

class BackgroundController {
  private currentMedia: BackgroundItem | null = null;
  private currentIndex: number = -1;
  private startTime: number = Date.now();
  private timer: NodeJS.Timeout | null = null;
  private allMedia: BackgroundItem[] = [];
  private rotationMedia: BackgroundItem[] = [];
  private waitingList: BackgroundItem[] = [];
  private onStateChange: (() => void) | null = null;
  private stateId: number = 0;
  private pollingTimer: NodeJS.Timeout | null = null;
  private fetchingMetadata: Set<string> = new Set();
  private isPaused: boolean = false;

  // Performance: Map-based metadata cache for O(1) lookups
  private metadataCache = new Map<string, BackgroundItem["metadata"]>();

  // Performance: Debounce timer for refreshMedia
  private refreshDebounceTimer: NodeJS.Timeout | null = null;

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

  // Public debounced version for external calls (e.g., after file uploads)
  public debouncedRefreshMedia(delayMs: number = 300) {
    if (this.refreshDebounceTimer) clearTimeout(this.refreshDebounceTimer);
    this.refreshDebounceTimer = setTimeout(() => this.refreshMedia(), delayMs);
  }

  public async refreshMedia() {
    const { backgroundsDir } = getProjectPaths();
    const config = configManager.getConfig();

    // Performance: Async directory scanning
    const scanDirAsync = async (
      dir: string,
      relativePath: string = "",
    ): Promise<BackgroundItem[]> => {
      const { promises: fsPromises } = await import("node:fs");

      try {
        await fsPromises.access(dir);
      } catch {
        return [];
      }

      const entries = await fsPromises.readdir(dir, { withFileTypes: true });
      let results: BackgroundItem[] = [];

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const folderName = relativePath || "root";

        if (entry.isDirectory()) {
          // One level deep is enough for now as requested
          if (!relativePath) {
            const subItems = await scanDirAsync(fullPath, entry.name);
            results = [...results, ...subItems];
          }
        } else {
          const ext = path.extname(entry.name).toLowerCase();
          let type: MediaType | null = null;

          if (this.mediaExtensions.image.includes(ext)) {
            type = "image";
          } else if (this.mediaExtensions.video.includes(ext)) {
            type = "video";
          }

          if (type) {
            results.push({
              url: `/backgrounds/${relativePath ? relativePath + "/" : ""}${entry.name}`,
              type,
              folder: folderName,
            });
          }
        }
      }
      return results;
    };

    const scannedMedia = await scanDirAsync(backgroundsDir);
    const externalMedia: BackgroundItem[] = (
      config.background.externalMediaUrlList || []
    ).map((m) => ({
      url: m.url,
      type: m.type,
    }));

    const newAllMedia = [...externalMedia, ...scannedMedia];

    // Filter for rotation
    const newRotationMedia = newAllMedia.filter((item) => {
      // If using all folders, include everything
      if (config.background.useAllFolders !== false) return true;

      const isExternal = item.url.startsWith("http");

      if (isExternal) {
        // Strict: only include if explicitly enabled in the list
        if (!config.background.enabledExternalUrls) return false;
        return config.background.enabledExternalUrls.includes(item.url);
      }

      // Local media filtered by folder settings
      if (!config.background.enabledFolders) return false;
      return config.background.enabledFolders.includes(item.folder || "root");
    });

    // Check if media list actually changed to avoid redundant updates
    const hasChanged =
      this.allMedia.length !== newAllMedia.length ||
      this.allMedia.some((m, i) => m.url !== newAllMedia[i]?.url) ||
      this.rotationMedia.length !== newRotationMedia.length;

    if (hasChanged) {
      // Performance: Use Map cache for O(1) metadata lookups
      for (const item of newAllMedia) {
        const cachedMetadata = this.metadataCache.get(item.url);
        if (cachedMetadata) {
          item.metadata = cachedMetadata;
        }
      }

      this.allMedia = newAllMedia;
      this.rotationMedia = newRotationMedia;

      console.log(
        `[Server] BackgroundController | Media Refreshed | Total: ${this.allMedia.length}, Rotation: ${this.rotationMedia.length}`,
      );

      // Ensure currentMedia is still valid (must be in rotation)
      if (this.currentMedia) {
        const stillInRotation = this.rotationMedia.find(
          (m) => m.url === this.currentMedia?.url,
        );
        if (!stillInRotation) {
          console.log(
            `[Server] BackgroundController | Current media ${this.currentMedia.url} no longer in rotation, skipping to next.`,
          );
          this.currentMedia = null;
          await this.next();
        } else {
          // Update reference
          this.currentMedia = stillInRotation;
        }
      } else if (this.rotationMedia.length > 0) {
        await this.next();
      }
    }
  }

  private startTimer() {
    if (this.timer) clearInterval(this.timer);
    if (this.isPaused) return;

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
        `[Server] BackgroundController | Starting local polling (${interval}ms)`,
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
        if (this.rotationMedia.length === 0) {
          await this.refreshMedia();
        }

        if (this.rotationMedia.length === 0) return;

        if (config.background.playbackOrder === "random") {
          this.currentIndex = Math.floor(
            Math.random() * this.rotationMedia.length,
          );
        } else {
          this.currentIndex =
            (this.currentIndex + 1) % this.rotationMedia.length;
        }
        this.currentMedia = this.rotationMedia[this.currentIndex];
      }

      this.stateId++;
      console.log(
        `[Server] BackgroundController | Next | picked ${this.currentMedia?.url} (stateId: ${this.stateId})`,
      );

      this.startTime = Date.now();
      this.startTimer(); // Reset timer
      this.notifyStateChange();
    } catch (err) {
      console.error("[Server] BackgroundController | Next | Error:", err);
    } finally {
      this.isNextRunning = false;
    }
  }

  private async fetchMetadataForCurrent() {
    if (
      !this.currentMedia ||
      !this.currentMedia.url ||
      !this.currentMedia.url.startsWith("/backgrounds/") ||
      this.currentMedia.metadata ||
      this.fetchingMetadata.has(this.currentMedia.url)
    ) {
      return;
    }

    const url = this.currentMedia.url;
    this.fetchingMetadata.add(url);

    const { backgroundsDir } = getProjectPaths();
    const relativePath = decodeURIComponent(url.replace("/backgrounds/", ""));
    const filePath = path.join(backgroundsDir, relativePath);

    try {
      if (!fs.existsSync(filePath)) {
        return;
      }

      const stats = fs.statSync(filePath);
      const rawMeta = await exiftool.read(filePath);
      const ext = path.extname(relativePath).toLowerCase();

      // Check if currentMedia is still the same
      if (this.currentMedia?.url === url) {
        const metadata = mapMetadata(rawMeta, {
          fileName: relativePath,
          fileSize: stats.size,
          mimeType:
            this.currentMedia.type === "image"
              ? `image/${ext.slice(1).replace("jpg", "jpeg")}`
              : `video/${ext.slice(1)}`,
        });
        this.currentMedia.metadata = metadata;

        // Performance: Cache metadata for O(1) lookups on refresh
        this.metadataCache.set(url, metadata);

        console.log(
          `[Server] BackgroundController | Metadata cached for: ${relativePath}`,
        );
        this.notifyStateChange(); // Notify that metadata is now available
      }
    } catch (err) {
      console.error(
        `[Server] BackgroundController | Error during metadata fetch for ${relativePath}:`,
        err,
      );
    } finally {
      this.fetchingMetadata.delete(url);
    }
  }

  public async getStatus() {
    const config = configManager.getConfig();
    const interval = config.background.interval || 30000;
    const transitionMode = config.background.transitionMode || "fade";

    const elapsed = Date.now() - this.startTime;
    const remaining = Math.max(0, interval - elapsed);

    // If currentMedia is null but we have media, trigger next()
    if (!this.currentMedia && this.rotationMedia.length > 0) {
      await this.next();
    }

    // Lazy load metadata for current media (non-blocking)
    if (
      this.currentMedia &&
      !this.currentMedia.metadata &&
      !this.fetchingMetadata.has(this.currentMedia.url)
    ) {
      this.fetchMetadataForCurrent().catch((e) => {
        console.error(
          "[Server] BackgroundController | getStatus | Metadata error:",
          e,
        );
      });
    }

    // Calculate next media for preloading
    let nextMedia: BackgroundItem | null = null;
    if (this.waitingList.length > 0) {
      nextMedia = this.waitingList[0];
    } else if (this.rotationMedia.length > 0) {
      const nextIndex = (this.currentIndex + 1) % this.rotationMedia.length;
      nextMedia = this.rotationMedia[nextIndex];
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
      isPaused: this.isPaused,
    };
  }

  public addToWaitingList(item: BackgroundItem) {
    this.waitingList.push(item);
    console.log(
      `[Server] BackgroundController | Waiting List | Added: ${item.url} (Total: ${this.waitingList.length})`,
    );
    this.notifyStateChange();
  }

  public removeFromWaitingList(index: number) {
    if (index >= 0 && index < this.waitingList.length) {
      const removed = this.waitingList.splice(index, 1)[0];
      console.log(
        `[Server] BackgroundController | Waiting List | Removed: ${removed.url} (Total: ${this.waitingList.length})`,
      );
      this.notifyStateChange();
    }
  }

  public togglePause() {
    this.isPaused = !this.isPaused;
    console.log(
      `[Server] BackgroundController | ${this.isPaused ? "Paused" : "Resumed"}`,
    );

    if (this.isPaused) {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    } else {
      this.startTime = Date.now();
      this.startTimer();
    }

    this.notifyStateChange();
    return this.isPaused;
  }

  public getAllMedia() {
    return this.allMedia;
  }

  public getFolders() {
    const { backgroundsDir } = getProjectPaths();
    if (!fs.existsSync(backgroundsDir)) return ["root"];

    const folders = fs
      .readdirSync(backgroundsDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    return ["root", ...folders];
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
