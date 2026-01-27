import type { ModuleDefinition } from "../BaseModule";
import WeatherModule from "./WeatherModule.vue";
import WeatherSettings from "./WeatherSettings.vue";

export interface WeatherModuleConfig {
  weatherProvider: "openmeteo";
  type: "current";
  lat: number;
  lon: number;
  showProvider?: boolean;
  showWindSpeed?: boolean;
  showHumidity?: boolean;
  showSunriseSunset?: boolean;
  showLocation?: boolean;
  showForecast?: boolean;
}

export const WeatherModuleDefinition: ModuleDefinition = {
  id: "weather",
  name: "Weather",
  icon: "i-heroicons-cloud",
  component: WeatherModule,
  settingsComponent: WeatherSettings,
  defaultConfig: {
    weatherProvider: "openmeteo",
    type: "current",
    lat: 48.0862,
    lon: 14.0433,
    showProvider: true,
    showWindSpeed: true,
    showHumidity: true,
    showSunriseSunset: true,
    showLocation: true,
    showForecast: true,
  } as WeatherModuleConfig,
  translations: {
    en: {
      name: "Weather",
      provider: "Weather Provider",
      latitude: "Latitude",
      longitude: "Longitude",
      showProvider: "Show Provider",
      showWindSpeed: "Show Wind Speed",
      showHumidity: "Show Humidity",
      showSunriseSunset: "Show Sunrise/Sunset",
      showLocation: "Show Location",
      showForecast: "Show Forecast",
      fetching: "Fetching weather...",
    },
    de: {
      name: "Wetter",
      provider: "Wetteranbieter",
      latitude: "Breitengrad",
      longitude: "Längengrad",
      showProvider: "Anbieter zeigen",
      showWindSpeed: "Windgeschwindigkeit zeigen",
      showHumidity: "Luftfeuchtigkeit zeigen",
      showSunriseSunset: "Sonnenauf-/untergang zeigen",
      showLocation: "Ort zeigen",
      showForecast: "Vorhersage zeigen",
      fetching: "Wetterdaten werden geladen...",
    },
  },
};
