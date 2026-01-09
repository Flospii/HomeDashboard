import type { MediaMetadata } from "../../app/types/config";

export const mapMetadata = (
  raw: any,
  fileInfo: {
    fileName: string;
    fileSize: number;
    mimeType: string;
    createdAt?: Date | string;
    modifiedAt?: Date | string;
  }
): MediaMetadata | undefined => {
  const meta: any = {
    ...fileInfo,
  };

  if (!raw) {
    // Ensure dates are strings even if no raw metadata
    if (meta.createdAt instanceof Date)
      meta.createdAt = meta.createdAt.toISOString();
    if (meta.modifiedAt instanceof Date)
      meta.modifiedAt = meta.modifiedAt.toISOString();
    return meta as MediaMetadata;
  }

  // Prioritize EXIF dates if available
  const exifDate = raw.DateTimeOriginal || raw.CreateDate || raw.ModifyDate;
  if (exifDate) {
    meta.createdAt = exifDate;
    meta.modifiedAt = exifDate;
  }

  // Ensure dates are strings for JSON compatibility
  if (meta.createdAt instanceof Date)
    meta.createdAt = meta.createdAt.toISOString();
  if (meta.modifiedAt instanceof Date)
    meta.modifiedAt = meta.modifiedAt.toISOString();

  // GPS mapping
  if (raw.latitude !== undefined && raw.longitude !== undefined) {
    meta.gps = {
      latitude: raw.latitude,
      longitude: raw.longitude,
      altitude: raw.altitude,
    };
  }

  return meta as MediaMetadata;
};
