import type { ModuleDefinition } from "../BaseModule";
import ClockModule from "./ClockModule.vue";
import ClockSettings from "./ClockSettings.vue";

export interface ClockModuleConfig {
  displaySeconds: boolean;
}

export const ClockModuleDefinition: ModuleDefinition = {
  id: "clock",
  name: "Clock",
  icon: "i-heroicons-clock",
  component: ClockModule,
  settingsComponent: ClockSettings,
  defaultConfig: {
    displaySeconds: true,
  } as ClockModuleConfig,
  translations: {
    en: {
      name: "Clock",
      displaySeconds: "Display Seconds",
      secondsDescription: "Show or hide the seconds counter",
    },
    de: {
      name: "Uhr",
      displaySeconds: "Sekunden anzeigen",
      secondsDescription: "Sekundenanzeige ein- oder ausschalten",
    },
  },
};
