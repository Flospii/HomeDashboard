import type { BackgroundMediaMetadata } from "../../app/components/modules/BackgroundMetadata";

/**
 * Extract and normalize metadata from a Directus file entry.
 * Directus splits EXIF data across multiple top-level keys:
 *   - metadata.exif: camera settings (FNumber, ISO, FocalLength, etc.)
 *   - metadata.gps: GPS coordinates (GPSLatitude, GPSLongitude as DMS arrays)
 *   - metadata.ifd0: basic image info (Make, Model, DateTime)
 */
export function extractMetadata(entry: any): BackgroundMediaMetadata {
  const m = (entry.metadata || {}) as any;
  const exif = m.exif || {};
  const ifd0 = m.ifd0 || {};

  return {
    fileName: entry.filename_download,
    fileSize: entry.filesize ? parseInt(entry.filesize) : 0,
    mimeType: entry.type || "",
    createdAt: extractDate(exif, ifd0, entry.uploaded_on),
    modifiedAt: entry.modified_on,
    gps: extractGPS(m),
    camera: extractCamera(exif, ifd0),
    focalLength: extractFocalLength(exif),
    iso: extractISO(exif),
    aperture: exif.FNumber ? `f/${exif.FNumber}` : undefined,
    exposureTime: formatExposureTime(exif.ExposureTime),
  };
}

/**
 * Extract the best available creation date.
 * Priority: EXIF DateTimeOriginal → DateTimeDigitized → ifd0 DateTime → upload date
 */
function extractDate(
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
function extractCamera(exif: any, ifd0: any): string | undefined {
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
function extractFocalLength(exif: any): number | undefined {
  // Prefer 35mm equivalent for more meaningful display
  return exif.FocalLengthIn35mmFilm || exif.FocalLength || undefined;
}

/**
 * Extract ISO value. Some cameras store ISOSpeedRatings as an array.
 */
function extractISO(exif: any): number | undefined {
  const iso = exif.ISOSpeedRatings;
  if (Array.isArray(iso)) return iso[0];
  if (typeof iso === "number") return iso;
  return undefined;
}

/**
 * Format exposure time as a human-readable fraction.
 * E.g. 0.00025 → "1/4000", 0.5 → "1/2", 2.0 → "2"
 */
function formatExposureTime(value: any): string | undefined {
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
function extractGPS(
  metadata: any,
): { latitude: number; longitude: number; altitude?: number } | undefined {
  const sources = [metadata?.gps, metadata?.exif].filter(Boolean);

  for (const source of sources) {
    const lat = source.GPSLatitude;
    const lon = source.GPSLongitude;
    const latRef = source.GPSLatitudeRef;
    const lonRef = source.GPSLongitudeRef;

    if (lat != null && lon != null) {
      const latitude = parseGPSCoordinate(lat, latRef);
      const longitude = parseGPSCoordinate(lon, lonRef);

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
function parseGPSCoordinate(value: any, ref?: string): number | undefined {
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
