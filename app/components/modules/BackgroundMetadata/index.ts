import type { ModuleDefinition } from "../BaseModule/types";
import BackgroundMetadataModule from "./BackgroundMetadataModule.vue";
import BackgroundMetadataSettings from "./BackgroundMetadataSettings.vue";

export interface GPSLocation {
  latitude: number;
  longitude: number;
  altitude?: number;
}

export interface BackgroundMediaMetadata {
  fileName: string;
  fileSize: number; // in bytes
  mimeType: string;
  createdAt?: string;
  modifiedAt?: string;
  gps?: GPSLocation;
  camera?: string;
  focalLength?: number;
  iso?: number;
  aperture?: string;
  exposureTime?: string;
}

export interface BackgroundMetadataModuleConfig {
  showFileName?: boolean;
  showFileSize?: boolean;
  showMimeType?: boolean;
  showCreatedAt?: boolean;
  showModifiedAt?: boolean;
  showGPS?: boolean;
  showCamera?: boolean;
  showFocalLength?: boolean;
  showISO?: boolean;
  showAperture?: boolean;
  showExposureTime?: boolean;
}

export const BackgroundMetadataModuleDefinition: ModuleDefinition = {
  id: "background-metadata",
  name: "Background Metadata",
  icon: "i-heroicons-information-circle",
  component: BackgroundMetadataModule,
  settingsComponent: BackgroundMetadataSettings,
  defaultConfig: {
    showFileName: false,
    showFileSize: false,
    showMimeType: false,
    showGPS: true,
    showCreatedAt: true,
    showModifiedAt: false,
    showCamera: true,
    showFocalLength: false,
    showISO: false,
    showAperture: false,
    showExposureTime: false,
  } as BackgroundMetadataModuleConfig,
  translations: {
    en: {
      name: "Background Info",
      fileName: "Show File Name",
      fileSize: "Show File Size",
      mimeType: "Show Mime Type",
      gps: "Show GPS",
      createdAt: "Created",
      modifiedAt: "Modified",
      camera: "Camera Model",
      focalLength: "Focal Length",
      iso: "ISO Speed",
      aperture: "Aperture (f-stop)",
      exposureTime: "Exposure Time",
      settings: {
        createdAt: "Show Created Date",
        modifiedAt: "Show Modified Date",
      },
    },
    de: {
      name: "Hintergrund-Info",
      fileName: "Dateiname zeigen",
      fileSize: "Dateigröße zeigen",
      mimeType: "MIME-Typ zeigen",
      gps: "GPS zeigen",
      createdAt: "Erstellt",
      modifiedAt: "Geändert",
      camera: "Kameramodell",
      focalLength: "Brennweite",
      iso: "ISO-Wert",
      aperture: "Blende",
      exposureTime: "Belichtungszeit",
      settings: {
        createdAt: "Erstellungsdatum zeigen",
        modifiedAt: "Änderungsdatum zeigen",
      },
    },
  },
};
