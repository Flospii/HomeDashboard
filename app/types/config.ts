export type MediaType = "image" | "video";

import type { BackgroundMediaMetadata } from "../components/modules/BackgroundMetadata";

export interface BackgroundItem {
  url: string;
  type: MediaType;
  folder?: string;
  metadata?: BackgroundMediaMetadata;
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

export const VIDEO_PLAYBACK_MODES = ["loop", "once"] as const;
export type VideoPlaybackMode = (typeof VIDEO_PLAYBACK_MODES)[number];

export type AnyModuleConfig = Record<string, any>;

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
    videoPlaybackMode?: VideoPlaybackMode;
    lowPowerMode?: boolean;
    enabledFolders?: string[];
    enabledExternalUrls?: string[];
    useAllFolders?: boolean;
  };
  language?: string;
  modules: ModuleConfig[];
}
