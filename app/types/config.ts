export type MediaType = "image" | "video";

export interface BackgroundItem {
  url: string;
  type: MediaType;
}

export const MODULE_POSITIONS = [
  "top_left",
  "top_center",
  "top_right",
  "middle_left",
  "middle_center",
  "middle_right",
  "bottom_left",
  "bottom_center",
  "bottom_right",
] as const;

export type ModulePosition = (typeof MODULE_POSITIONS)[number];

export const TRANSITION_MODES = ["fade", "slide", "zoom", "blur"] as const;
export type TransitionMode = (typeof TRANSITION_MODES)[number];

export const PLAYBACK_MODES = ["sequential", "random"] as const;
export type PlaybackMode = (typeof PLAYBACK_MODES)[number];

export interface ClockModuleConfig {
  displaySeconds: boolean;
}

export interface WeatherModuleConfig {
  weatherProvider: "openmeteo";
  type: "current";
  lat: number;
  lon: number;
}

export interface NewsModuleConfig {
  // Add news specific config if any
}

export type AnyModuleConfig =
  | ClockModuleConfig
  | WeatherModuleConfig
  | NewsModuleConfig
  | Record<string, any>;

export interface ModuleConfig {
  id: string;
  module: string;
  position: ModulePosition;
  enabled: boolean;
  config: AnyModuleConfig;
}

export interface DashboardConfig {
  background: {
    externalMediaUrlList: BackgroundItem[];
    interval: number;
    useLocalBackgrounds?: boolean;
    localPollingInterval?: number;
    transitionMode?: TransitionMode;
    playbackOrder?: PlaybackMode;
  };
  modules: ModuleConfig[];
}
