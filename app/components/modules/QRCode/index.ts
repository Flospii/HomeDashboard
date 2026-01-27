import type { ModuleDefinition } from "../BaseModule";
import QRCodeModule from "./QRCodeModule.vue";
import QRCodeSettings from "./QRCodeSettings.vue";

export interface QRCodeModuleConfig {
  type: "custom" | "media-upload";
  title?: string;
  customUrl?: string;
  showUrl?: boolean;
}

export const QRCodeModuleDefinition: ModuleDefinition = {
  id: "qrcode",
  name: "QR Code",
  icon: "i-heroicons-qr-code",
  component: QRCodeModule,
  settingsComponent: QRCodeSettings,
  defaultConfig: {
    type: "media-upload",
    title: "Upload Media",
    showUrl: true,
  } as QRCodeModuleConfig,
  translations: {
    en: {
      name: "QR Code",
      type: "QR Code Type",
      typeDescription:
        "Select whether to show a custom link or a media upload link",
      custom: "Custom URL",
      mediaUpload: "Media Upload Link",
      title: "Module Title",
      titleDescription: "Optional title shown above the QR code",
      url: "Target URL",
      urlDescription: "The URL the QR code should point to",
      showUrl: "Display URL",
      showUrlDescription: "Show the URL text below the QR code",
    },
    de: {
      name: "QR-Code",
      type: "QR-Code-Typ",
      typeDescription:
        "Wählen Sie, ob ein benutzerdefinierter Link oder ein Medien-Upload-Link angezeigt werden soll",
      custom: "Benutzerdefinierte URL",
      mediaUpload: "Medien-Upload-Link",
      title: "Modultitel",
      titleDescription: "Optionaler Titel über dem QR-Code",
      url: "Ziel-URL",
      urlDescription: "Die URL, auf die der QR-Code verweisen soll",
      showUrl: "URL anzeigen",
      showUrlDescription: "Zeigt den URL-Text unter dem QR-Code an",
    },
  },
};
