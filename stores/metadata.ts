import { defineStore } from "pinia";

interface SiteMetadata {
  siteName: string;
  instagramLink: string;
  linkedInLink: string;
}

export const useMetadataStore = defineStore("metadataStore", {
  state: (): SiteMetadata => ({
    siteName: "QR Code Generator",
    instagramLink: "https://www.instagram.com/florianspitzbart/",
    linkedInLink: "https://www.linkedin.com/in/florian-spitzbart-b8154b265/",
  }),
  getters: {
    capitalizedSiteName(state: { siteName: string }) {
      return state.siteName.toUpperCase();
    },
    getInstagramLink(state: { instagramLink: string }) {
      return state.instagramLink;
    },
    getLinkedInLink(state: { linkedInLink: string }) {
      return state.linkedInLink;
    },
  },
  actions: {
    updateSiteName(newName: string) {
      this.siteName = newName;
    },
  },
});
