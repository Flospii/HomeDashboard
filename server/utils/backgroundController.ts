import { configManager } from "./config";
import type { BackgroundItem } from "../../app/types/config";
import { createDirectusClient, getDirectusUrl } from "./directus";
import { readFiles, readFolders, type DirectusFile, type DirectusFolder } from "@directus/sdk";

const DIRECTUS_URL = getDirectusUrl();

// ExifTool removed in favor of Directus metadata



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
    await this.getFolders();
    const config = configManager.getConfig();

    let files: any[] = [];
    try {
      const client = createDirectusClient();
      // Using explicit field selection to ensure we get metadata and location
      files = await client.request(readFiles({ 
        limit: -1,
        fields: ['id', 'filename_download', 'filesize', 'type', 'width', 'height', 'uploaded_on', 'modified_on', 'metadata', 'location', { folder: ['id'] }]
      })) as any[];
      console.log(`[Server] BackgroundController | Found ${files.length} raw files in Directus.`);
    } catch(e: any) {
      console.error("[Server] BackgroundController | Error fetching files from Directus:", e.message || e);
    }
    const isImage = (f: any) => (f.type || '').startsWith('image/') || (f.filename_download || f.title || '').match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
    const isVideo = (f: any) => (f.type || '').startsWith('video/') || (f.filename_download || f.title || '').match(/\.(mp4|mov|webm|ogg)$/i);

    const scannedMedia: BackgroundItem[] = files
      .filter((entry) => isImage(entry) || isVideo(entry))
      .map((entry) => {
        const m = (entry.metadata || {}) as any;
        const location = entry.location as any;
        return {
        url: `${DIRECTUS_URL}/assets/${entry.id}`,
        type: isVideo(entry) ? "video" : "image",
        folder: typeof entry.folder === 'string' ? entry.folder : entry.folder?.id || "root",
        metadata: {
           fileName: entry.filename_download,
           fileSize: entry.filesize ? parseInt(entry.filesize) : 0,
           mimeType: entry.type || '',
           dimensions: entry.width && entry.height ? { width: entry.width, height: entry.height } : undefined,
           createdAt: m.exif?.DateTimeOriginal,
           modifiedAt: entry.modified_on,
           gps: location && location.coordinates ? { 
             latitude: location.coordinates[1], 
             longitude: location.coordinates[0] 
           } : undefined,
           camera: m.exif?.Make || m.exif?.Model ? `${m.exif?.Make || ''} ${m.exif?.Model || ''}`.trim() : undefined,
           focalLength: m.exif?.FocalLength,
           iso: m.exif?.ISOSpeedRatings,
           aperture: m.exif?.FNumber ? `f/${m.exif?.FNumber}` : undefined,
           exposureTime: m.exif?.ExposureTime
        }
      }});

    const newAllMedia = scannedMedia;

    // Filter for rotation
    const newRotationMedia = newAllMedia.filter((item) => {
      // If using all folders, include everything
      if (config.background.useAllFolders !== false) return true;

      // Local media filtered by folder settings
      if (!config.background.enabledFolders) return false;
      
      return this.isFolderEnabled(item.folder, config.background.enabledFolders);
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
    // In Directus mode, we always want to poll for new files/changes unless explicitly disabled
    // interpreting useLocalBackgrounds as "Poll for media updates"
    if (config.background.useLocalBackgrounds !== false) {
      const interval = config.background.localPollingInterval || 30000;
      console.log(
        `[Server] BackgroundController | Starting Directus polling (${interval}ms)`,
      );
      this.pollingTimer = setInterval(() => this.refreshMedia(), interval);
    }
  }

  public async reconfigure() {
    console.log("[Server] BackgroundController | Reconfiguring...");
    await configManager.fetchFromDirectus();
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
        this.currentMedia = this.rotationMedia[this.currentIndex] || null;
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
      if (removed) {
        console.log(
          `[Server] BackgroundController | Waiting List | Removed: ${removed.url} (Total: ${this.waitingList.length})`,
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

  private folders: DirectusFolder[] = [];

  public async getFolders() {
    try {
      const client = createDirectusClient();
      const data = await client.request(readFolders({ limit: -1 }));
      this.folders = (data as unknown as DirectusFolder[]) || [];
      return [{ id: 'root', name: 'Root', parent: null }, ...this.folders];
    } catch (e: any) {
      console.error("[Server] BackgroundController | Error fetching folders from SDK:", e.message || e);
      return [{ id: 'root', name: 'Root', parent: null }];
    }
  }

  private isFolderEnabled(folderId: string | null | undefined, enabledFolders: string[]): boolean {
    const target = folderId || "root";
    if (enabledFolders.includes(target)) return true;
    
    // Recursive check: Is any parent enabled?
    let current = this.folders.find(f => f.id === target);
    while (current && current.parent) {
      const parentId = typeof current.parent === 'string' ? current.parent : (current.parent as any).id;
      if (enabledFolders.includes(parentId)) return true;
      current = this.folders.find(f => f.id === parentId);
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
