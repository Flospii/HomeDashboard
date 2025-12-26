<template>
  <UApp :locale="locales[locale]">
    <div class="fixed inset-0 overflow-hidden bg-black text-white font-sans">
      <NuxtPage />
    </div>
  </UApp>
</template>

<script setup lang="ts">
import * as locales from "@nuxt/ui/locale";

const { locale } = useI18n();
</script>

<style>
body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  background-color: black;
}
</style>
