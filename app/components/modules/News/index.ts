import type { ModuleDefinition } from "../BaseModule";
import NewsModule from "./NewsModule.vue";
import NewsSettings from "./NewsSettings.vue";

export interface NewsFeed {
  title: string;
  url: string;
}

export interface NewsModuleConfig {
  feeds: NewsFeed[];
  showSourceTitle: boolean;
  showPublishDate: boolean;
  rotationInterval: number;
}

export const NewsModuleDefinition: ModuleDefinition = {
  id: "news",
  name: "News",
  icon: "i-heroicons-newspaper",
  component: NewsModule,
  settingsComponent: NewsSettings,
  defaultConfig: {
    feeds: [
      {
        title: "BBC News",
        url: "https://feeds.bbci.co.uk/news/rss.xml",
      },
      {
        title: "Der Standard",
        url: "https://www.derstandard.at/rss",
      },
    ],
    showSourceTitle: true,
    showPublishDate: true,
    rotationInterval: 15000,
  } as NewsModuleConfig,
  translations: {
    en: {
      name: "News Feeds",
      title: "RSS Feeds",
      addFeed: "Add Feed",
      feedTitle: "Feed Title",
      rssUrl: "RSS URL",
      showSource: "Show Source",
      showDate: "Show Date",
      rotationInterval: "Rotation Interval (ms)",
      rotationDescription: "Time between news items",
      fetching: "Fetching latest headlines...",
      noFeeds: "No news feeds configured.",
      loadError: "Could not load news headlines.",
      error: "Error loading news.",
    },
    de: {
      name: "Nachrichten",
      title: "RSS-Feeds",
      addFeed: "Feed hinzufügen",
      feedTitle: "Feed-Titel",
      rssUrl: "RSS-URL",
      showSource: "Quelle zeigen",
      showDate: "Datum zeigen",
      rotationInterval: "Rotationsintervall (ms)",
      rotationDescription: "Zeit zwischen den Nachrichten",
      fetching: "Schlagzeilen werden geladen...",
      noFeeds: "Keine Nachrichtensender konfiguriert.",
      loadError: "Schlagzeilen konnten nicht geladen werden.",
      error: "Fehler beim Laden der Nachrichten.",
    },
  },
};
