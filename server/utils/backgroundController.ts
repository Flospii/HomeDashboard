import { configManager } from "./config";
import type { BackgroundItem } from "../../app/types/config";
import { createDirectusClient, getDirectusUrl } from "./directus";
import { readFiles, readFolders, type DirectusFolder } from "@directus/sdk";

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

  // Performance: Fingerprint for lightweight polling change detection
  private lastFileFingerprint: string = "";

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
      files = (await client.request(
        readFiles({
          limit: -1,
          fields: [
            "id",
            "filename_download",
            "filesize",
            "type",
            "width",
            "height",
            "uploaded_on",
            "modified_on",
            "metadata",
            { folder: ["id"] },
          ],
        }),
      )) as any[];
    } catch (e: any) {
      console.error(
        "[Server] BackgroundController | Error fetching files from Directus:",
        e.message || e,
      );
      return;
    }

    // Update fingerprint from the full fetch data
    this.lastFileFingerprint = this.computeFingerprint(files);

    const isImage = (f: any) =>
      (f.type || "").startsWith("image/") ||
      (f.filename_download || f.title || "").match(
        /\.(jpg|jpeg|png|gif|webp|svg)$/i,
      );
    const isVideo = (f: any) =>
      (f.type || "").startsWith("video/") ||
      (f.filename_download || f.title || "").match(
        /\.(mp4|mov|webm|ogg|m4v|mkv)$/i,
      );

    const scannedMedia: BackgroundItem[] = files
      .filter((entry) => isImage(entry) || isVideo(entry))
      .map((entry) => ({
        id: entry.id,
        type: isVideo(entry) ? "video" : "image",
        folder:
          typeof entry.folder === "string"
            ? entry.folder
            : entry.folder?.id || "root",
        metadata: this.extractMetadata(entry),
      }));

    const newAllMedia = scannedMedia;

    // Filter for rotation
    const newRotationMedia = newAllMedia.filter((item) => {
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
      this.allMedia.length !== newAllMedia.length ||
      this.allMedia.some((m, i) => m.id !== newAllMedia[i]?.id) ||
      this.rotationMedia.length !== newRotationMedia.length;

    if (hasChanged) {
      // Performance: Use Map cache for O(1) metadata lookups
      for (const item of newAllMedia) {
        if (item.metadata) {
          this.metadataCache.set(item.id, item.metadata);
        } else {
          const cachedMetadata = this.metadataCache.get(item.id);
          if (cachedMetadata) {
            item.metadata = cachedMetadata;
          }
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

  /**
   * Lightweight polling: fetch only IDs + modified_on to detect changes.
   * Only triggers a full refreshMedia() if something actually changed.
   */
  private async pollForChanges() {
    try {
      const client = createDirectusClient();
      const lightFiles = (await client.request(
        readFiles({
          limit: -1,
          fields: ["id", "modified_on"],
        }),
      )) as any[];

      const fingerprint = this.computeFingerprint(lightFiles);
      if (fingerprint !== this.lastFileFingerprint) {
        console.log(
          "[Server] BackgroundController | Changes detected, refreshing media...",
        );
        await this.refreshMedia();
      }
    } catch (e: any) {
      console.error(
        "[Server] BackgroundController | Polling error:",
        e.message || e,
      );
    }
  }

  /**
   * Compute a fingerprint from file IDs and modification timestamps.
   * Used to detect changes without fetching full metadata.
   */
  private computeFingerprint(files: any[]): string {
    // Sort by ID for deterministic comparison
    const sorted = files
      .map((f) => `${f.id}:${f.modified_on || ""}`)
      .sort();
    return `${sorted.length}:${sorted.join(",")}`;
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

  private folders: DirectusFolder[] = [];

  public async getFolders() {
    try {
      const client = createDirectusClient();
      const data = await client.request(readFolders({ limit: -1 }));
      this.folders = (data as unknown as DirectusFolder[]) || [];
      return [{ id: "root", name: "Root", parent: null }, ...this.folders];
    } catch (e: any) {
      console.error(
        "[Server] BackgroundController | Error fetching folders from SDK:",
        e.message || e,
      );
      return [{ id: "root", name: "Root", parent: null }];
    }
  }

  /**
   * Extract and normalize metadata from a Directus file entry.
   * Directus splits EXIF data across multiple top-level keys:
   *   - metadata.exif: camera settings (FNumber, ISO, FocalLength, etc.)
   *   - metadata.gps: GPS coordinates (GPSLatitude, GPSLongitude as DMS arrays)
   *   - metadata.ifd0: basic image info (Make, Model, DateTime)
   */
  private extractMetadata(entry: any): BackgroundItem["metadata"] {
    const m = (entry.metadata || {}) as any;
    const exif = m.exif || {};
    const ifd0 = m.ifd0 || {};

    return {
      fileName: entry.filename_download,
      fileSize: entry.filesize ? parseInt(entry.filesize) : 0,
      mimeType: entry.type || "",
      createdAt: this.extractDate(exif, ifd0, entry.uploaded_on),
      modifiedAt: entry.modified_on,
      gps: this.extractGPS(m),
      camera: this.extractCamera(exif, ifd0),
      focalLength: this.extractFocalLength(exif),
      iso: this.extractISO(exif),
      aperture: exif.FNumber ? `f/${exif.FNumber}` : undefined,
      exposureTime: this.formatExposureTime(exif.ExposureTime),
    };
  }

  /**
   * Extract the best available creation date.
   * Priority: EXIF DateTimeOriginal → DateTimeDigitized → ifd0 DateTime → upload date
   */
  private extractDate(
    exif: any,
    ifd0: any,
    uploadedOn?: string,
  ): string | undefined {
    return (
      exif.DateTimeOriginal ||
      exif.DateTimeDigitized ||
      ifd0.DateTime ||
      uploadedOn ||
      undefined
    );
  }

  /**
   * Build camera model string, avoiding duplication.
   * Many cameras include Make in the Model (e.g. Make="Apple", Model="iPhone 15 Pro").
   * Some include it fully (Make="NIKON", Model="NIKON D850").
   */
  private extractCamera(exif: any, ifd0: any): string | undefined {
    const make = (ifd0.Make || exif.Make || "").trim();
    const model = (ifd0.Model || exif.Model || "").trim();

    if (!make && !model) return undefined;
    if (!make) return model;
    if (!model) return make;

    // Avoid "Apple Apple iPhone 15" or "NIKON NIKON D850"
    if (model.toLowerCase().startsWith(make.toLowerCase())) {
      return model;
    }
    return `${make} ${model}`;
  }

  /**
   * Extract focal length, appending 35mm equivalent if available.
   * Returns e.g. 4.25 (displayed as "4.25mm" in the UI), or the 35mm value.
   */
  private extractFocalLength(exif: any): number | undefined {
    // Prefer 35mm equivalent for more meaningful display
    return exif.FocalLengthIn35mmFilm || exif.FocalLength || undefined;
  }

  /**
   * Extract ISO value. Some cameras store ISOSpeedRatings as an array.
   */
  private extractISO(exif: any): number | undefined {
    const iso = exif.ISOSpeedRatings;
    if (Array.isArray(iso)) return iso[0];
    if (typeof iso === "number") return iso;
    return undefined;
  }

  /**
   * Format exposure time as a human-readable fraction.
   * E.g. 0.00025 → "1/4000", 0.5 → "1/2", 2.0 → "2"
   */
  private formatExposureTime(value: any): string | undefined {
    if (value == null) return undefined;
    const num = typeof value === "number" ? value : parseFloat(value);
    if (isNaN(num) || num <= 0) return undefined;

    if (num >= 1) return `${num}`;
    // Express as fraction: 1/x
    const denominator = Math.round(1 / num);
    return `1/${denominator}`;
  }

  /**
   * Extract GPS coordinates from Directus file metadata.
   * Directus separates EXIF GPS tags into `metadata.gps` (not `metadata.exif`).
   */
  private extractGPS(
    metadata: any,
  ): { latitude: number; longitude: number; altitude?: number } | undefined {
    const sources = [metadata?.gps, metadata?.exif].filter(Boolean);

    for (const source of sources) {
      const lat = source.GPSLatitude;
      const lon = source.GPSLongitude;
      const latRef = source.GPSLatitudeRef;
      const lonRef = source.GPSLongitudeRef;

      if (lat != null && lon != null) {
        const latitude = this.parseGPSCoordinate(lat, latRef);
        const longitude = this.parseGPSCoordinate(lon, lonRef);

        if (
          latitude != null &&
          longitude != null &&
          latitude >= -90 &&
          latitude <= 90 &&
          longitude >= -180 &&
          longitude <= 180
        ) {
          // Extract altitude if available
          const rawAlt = source.GPSAltitude;
          const altRef = source.GPSAltitudeRef;
          let altitude: number | undefined;
          if (rawAlt != null) {
            altitude = typeof rawAlt === "number" ? rawAlt : parseFloat(rawAlt);
            if (isNaN(altitude)) altitude = undefined;
            // AltitudeRef: 0 = above sea level, 1 = below sea level
            else if (altRef === 1) altitude = -altitude;
          }

          return { latitude, longitude, altitude };
        }
      }

      // Also check for simple latitude/longitude keys
      if (
        typeof source.latitude === "number" &&
        typeof source.longitude === "number"
      ) {
        return { latitude: source.latitude, longitude: source.longitude };
      }
    }

    return undefined;
  }

  /** Parse a GPS coordinate from DMS array, decimal, or string format. */
  private parseGPSCoordinate(value: any, ref?: string): number | undefined {
    let decimal: number;

    if (Array.isArray(value) && value.length === 3) {
      decimal = value[0] + value[1] / 60 + value[2] / 3600;
    } else if (typeof value === "number") {
      decimal = value;
    } else {
      decimal = parseFloat(value);
    }

    if (isNaN(decimal)) return undefined;

    if (ref === "S" || ref === "s" || ref === "W" || ref === "w") {
      decimal = -Math.abs(decimal);
    }

    return decimal;
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
