import type { Component } from "vue";
import type { AnyModuleConfig } from "../../../types/config";

export interface ModuleDefinition {
  id: string;
  name: string;
  icon: string;
  component: Component;
  settingsComponent: Component;
  defaultConfig: AnyModuleConfig;
  translations?: Record<string, any>;
}

export { default as BaseModule } from "./BaseModule.vue";
