// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  modules: ["@nuxt/ui", "@nuxtjs/i18n", "@nuxt/eslint", "@pinia/nuxt"],

  css: ["~/assets/css/main.css"],

  i18n: {
    strategy: "no_prefix",
    defaultLocale: "en",
    locales: [
      {
        code: "de",
        name: "Deutsch",
        file: "de.json",
      },
      {
        code: "en",
        name: "English",
        file: "en.json",
      },
    ],
  },

  compatibilityDate: "2024-11-27",
  nitro: {
    experimental: {
      websocket: true,
    },
  },
});
