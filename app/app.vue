<template>
  <UApp :locale="locales[locale]">
    <div class="fixed inset-0 overflow-y-auto bg-black text-white font-sans">
      <NuxtPage />
    </div>
  </UApp>
</template>

<script setup lang="ts">
import * as locales from "@nuxt/ui/locale";
import { useConfigStore } from "~~/stores/config";
import { AVAILABLE_MODULES } from "./components/modules";

const { locale, setLocale, mergeLocaleMessage } = useI18n();
const store = useConfigStore();

// Register module translations
AVAILABLE_MODULES.forEach((module) => {
  if (module.translations) {
    Object.entries(module.translations).forEach(([lang, messages]) => {
      mergeLocaleMessage(lang, {
        modules: {
          [module.id]: messages,
        },
      });
    });
  }
});

watch(
  () => store.config?.language,
  (newLang) => {
    if (newLang && newLang !== locale.value) {
      setLocale(newLang as any);
    }
  },
  { immediate: true },
);
</script>

<style>
body {
  margin: 0;
  padding: 0;
  background-color: black;
}
</style>
