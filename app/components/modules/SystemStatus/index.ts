import type { ModuleDefinition } from "../BaseModule";
import SystemStatusModule from "./SystemStatusModule.vue";
import SystemStatusSettings from "./SystemStatusSettings.vue";

export interface SystemStatusModuleConfig {
  showCPU: boolean;
  showMemory: boolean;
  showUptime: boolean;
  showOSInfo: boolean;
  updateInterval: number;
}

export const SystemStatusModuleDefinition: ModuleDefinition = {
  id: "system-status",
  name: "System Status",
  icon: "i-heroicons-cpu-chip",
  component: SystemStatusModule,
  settingsComponent: SystemStatusSettings,
  defaultConfig: {
    showCPU: true,
    showMemory: true,
    showUptime: true,
    showOSInfo: false,
    updateInterval: 5000,
  } as SystemStatusModuleConfig,
  translations: {
    en: {
      name: "System Status",
      showCPU: "Show CPU Usage",
      showMemory: "Show Memory Usage",
      showUptime: "Show Uptime",
      showOSInfo: "Show OS Info",
      updateInterval: "Update Interval (ms)",
      cpu: "CPU",
      memory: "RAM",
      uptime: "Uptime",
      fetching: "Fetching system stats...",
    },
    de: {
      name: "Systemstatus",
      showCPU: "CPU-Auslastung zeigen",
      showMemory: "Speicherauslastung zeigen",
      showUptime: "Betriebszeit zeigen",
      showOSInfo: "OS-Info zeigen",
      updateInterval: "Update-Intervall (ms)",
      cpu: "CPU",
      memory: "RAM",
      uptime: "Betriebszeit",
      fetching: "Systemdaten werden geladen...",
    },
  },
};
