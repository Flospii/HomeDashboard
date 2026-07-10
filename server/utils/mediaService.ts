import { createDirectusClient } from "./directus";
import { readFiles, readFolders, type DirectusFolder } from "@directus/sdk";
import type { BackgroundItem } from "../../app/types/config";
import { extractMetadata } from "./metadataExtractor";

export class MediaService {
  /**
   * Fetch all media (images/videos) from Directus, un-filtered by active rotation.
   */
  public async fetchAllMedia(): Promise<{ media: BackgroundItem[]; fingerprint: string }> {
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
        "[Server] MediaService | Error fetching files from Directus:",
        e.message || e,
      );
      return { media: [], fingerprint: "" };
    }

    const fingerprint = this.computeFingerprint(files);

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

    const media: BackgroundItem[] = files
      .filter((entry) => isImage(entry) || isVideo(entry))
      .map((entry) => ({
        id: entry.id,
        type: isVideo(entry) ? "video" : "image",
        folder:
          typeof entry.folder === "string"
            ? entry.folder
            : entry.folder?.id || "root",
        metadata: extractMetadata(entry),
      }));

    return { media, fingerprint };
  }

  /**
   * Fetch all folders from Directus.
   */
  public async fetchFolders(): Promise<DirectusFolder[]> {
    try {
      const client = createDirectusClient();
      const data = await client.request(readFolders({ limit: -1 }));
      const folders = (data as unknown as DirectusFolder[]) || [];
      return [{ id: "root", name: "Root", parent: null } as any, ...folders];
    } catch (e: any) {
      console.error(
        "[Server] MediaService | Error fetching folders from SDK:",
        e.message || e,
      );
      return [{ id: "root", name: "Root", parent: null } as any];
    }
  }

  /**
   * Lightweight polling: fetch only IDs + modified_on to detect changes.
   * Returns true if the fingerprint has changed.
   */
  public async hasMediaChanged(lastFingerprint: string): Promise<boolean> {
    try {
      const client = createDirectusClient();
      const lightFiles = (await client.request(
        readFiles({
          limit: -1,
          fields: ["id", "modified_on"],
        }),
      )) as any[];

      const fingerprint = this.computeFingerprint(lightFiles);
      return fingerprint !== lastFingerprint;
    } catch (e: any) {
      console.error("[Server] MediaService | Polling error:", e.message || e);
      return false; // On error, assume no changes to avoid thrashing
    }
  }

  /**
   * Compute a fingerprint from file IDs and modification timestamps.
   * Used to detect changes without fetching full metadata.
   */
  public computeFingerprint(files: any[]): string {
    // Sort by ID for deterministic comparison
    const sorted = files
      .map((f) => `${f.id}:${f.modified_on || ""}`)
      .sort();
    return `${sorted.length}:${sorted.join(",")}`;
  }
}
