import { configManager } from "./config";
import type { BackgroundItem } from "../../app/types/config";
import { MediaService } from "./mediaService";
import type { DirectusFolder } from "@directus/sdk";

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
  private isPaused: boolean = false;

  private refreshDebounceTimer: NodeJS.Timeout | null = null;
  private lastFileFingerprint: string = "";
  private isNextRunning: boolean = false;
  
  private mediaService = new MediaService();
  private folders: DirectusFolder[] = [];

  constructor() {
    this.init();
  }

  private async init() {
    console.log("[Server] BackgroundController | Initializing (deferred)...");
    // Wait a bit to let DirectusSetup finish provisioning
    setTimeout(() => this.reconfigure(), 5000);
  }

  // Public debounced version for external calls (e.g., after file uploads)
  public debouncedRefreshMedia(delayMs: number = 300) {
    if (this.refreshDebounceTimer) clearTimeout(this.refreshDebounceTimer);
    this.refreshDebounceTimer = setTimeout(() => this.refreshMedia(), delayMs);
  }

  public async refreshMedia() {
    this.folders = await this.mediaService.fetchFolders();
    const config = configManager.getConfig();

    const { media, fingerprint } = await this.mediaService.fetchAllMedia();
    this.lastFileFingerprint = fingerprint;

    // Filter for rotation
    const newRotationMedia = media.filter((item) => {
      // If using all folders, include everything
      if (config.background.useAllFolders !== false) return true;

      // Local media filtered by folder settings
      if (!config.background.enabledFolders) return false;

      return this.isFolderEnabled(
        item.folder,
        config.background.enabledFolders,
      );
    });

    // Check if media list actually changed to avoid redundant updates
    const hasChanged =
      this.allMedia.length !== media.length ||
      this.allMedia.some((m, i) => m.id !== media[i]?.id) ||
      this.rotationMedia.length !== newRotationMedia.length;

    if (hasChanged) {
      this.allMedia = media;
      this.rotationMedia = newRotationMedia;

      console.log(
        `[Server] BackgroundController | Media Refreshed | Total: ${this.allMedia.length}, Rotation: ${this.rotationMedia.length}`,
      );

      // Ensure currentMedia is still valid (must be in rotation)
      if (this.currentMedia) {
        const stillInRotation = this.rotationMedia.find(
          (m) => m.id === this.currentMedia?.id,
        );
        if (!stillInRotation) {
          console.log(
            `[Server] BackgroundController | Current media ${this.currentMedia.id} no longer in rotation, skipping to next.`,
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
    if (config.background.useLocalBackgrounds !== false) {
      const interval = config.background.localPollingInterval || 30000;
      console.log(
        `[Server] BackgroundController | Starting Directus polling (${interval}ms)`,
      );
      this.pollingTimer = setInterval(() => this.pollForChanges(), interval);
    }
  }

  private async pollForChanges() {
    const hasChanged = await this.mediaService.hasMediaChanged(this.lastFileFingerprint);
    if (hasChanged) {
      console.log(
        "[Server] BackgroundController | Changes detected, refreshing media...",
      );
      await this.refreshMedia();
    }
  }

  public async reconfigure() {
    console.log("[Server] BackgroundController | Reconfiguring...");
    await configManager.fetchFromDirectus();
    await this.refreshMedia();
    this.startTimer();
    this.startPolling();
  }

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
        this.currentMedia = this.rotationMedia[this.currentIndex] || null;
        if (this.currentMedia) {
          console.log(
            `[Server] BackgroundController | Rotation | Picked: ${this.currentMedia.id} (${this.currentMedia.type})`,
          );
        }
      }

      this.stateId++;
      console.log(
        `[Server] BackgroundController | Next | picked ${this.currentMedia?.id} (stateId: ${this.stateId})`,
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

    // Calculate next media for preloading
    let nextMedia: BackgroundItem | null = null;
    if (this.waitingList.length > 0) {
      nextMedia = this.waitingList[0] || null;
    } else if (this.rotationMedia.length > 0) {
      const nextIndex = (this.currentIndex + 1) % this.rotationMedia.length;
      nextMedia = this.rotationMedia[nextIndex] || null;
    }

    return {
      currentMedia: this.currentMedia,
      nextMedia: nextMedia ? { id: nextMedia.id, type: nextMedia.type } : null,
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
      `[Server] BackgroundController | Waiting List | Added: ${item.id} (Total: ${this.waitingList.length})`,
    );
    this.notifyStateChange();
  }

  public removeFromWaitingList(index: number) {
    if (index >= 0 && index < this.waitingList.length) {
      const removed = this.waitingList.splice(index, 1)[0];
      if (removed) {
        console.log(
          `[Server] BackgroundController | Waiting List | Removed: ${removed.id} (Total: ${this.waitingList.length})`,
        );
        this.notifyStateChange();
      }
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

  public async getFolders() {
    this.folders = await this.mediaService.fetchFolders();
    return this.folders;
  }

  private isFolderEnabled(
    folderId: string | null | undefined,
    enabledFolders: string[],
  ): boolean {
    const target = folderId || "root";
    if (enabledFolders.includes(target)) return true;

    // Recursive check: Is any parent enabled?
    let current = this.folders.find((f) => f.id === target);
    while (current && current.parent) {
      const parentId =
        typeof current.parent === "string"
          ? current.parent
          : (current.parent as any).id;
      if (enabledFolders.includes(parentId)) return true;
      current = this.folders.find((f) => f.id === parentId);
    }

    return false;
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
