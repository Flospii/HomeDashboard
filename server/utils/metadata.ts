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
    // exiftool-vendored might return ExifDateTime objects which have a .toDate() or .toString()
    // but often they are already strings or Date objects depending on config.
    // We'll handle both.
    if (typeof exifDate.toDate === "function") {
      meta.createdAt = exifDate.toDate().toISOString();
      meta.modifiedAt = exifDate.toDate().toISOString();
    } else {
      meta.createdAt = exifDate;
      meta.modifiedAt = exifDate;
    }
  }

  // Ensure dates are strings for JSON compatibility
  if (meta.createdAt instanceof Date)
    meta.createdAt = meta.createdAt.toISOString();
  if (meta.modifiedAt instanceof Date)
    meta.modifiedAt = meta.modifiedAt.toISOString();

  // GPS mapping (exiftool-vendored uses GPSLatitude/GPSLongitude)
  const lat = raw.GPSLatitude ?? raw.latitude;
  const lon = raw.GPSLongitude ?? raw.longitude;
  const alt = raw.GPSAltitude ?? raw.altitude;

  if (lat !== undefined && lon !== undefined) {
    meta.gps = {
      latitude: lat,
      longitude: lon,
      altitude: alt,
    };
  }

  return meta as MediaMetadata;
};
