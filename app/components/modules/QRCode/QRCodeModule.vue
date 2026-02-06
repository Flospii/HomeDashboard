<template>
  <BaseModule>
    <div class="flex flex-col items-center justify-center space-y-4 p-2">
      <div
        v-if="title"
        class="text-sm md:text-lg font-bold text-white opacity-80 uppercase tracking-widest text-center"
      >
        {{ title }}
      </div>

      <div class="bg-white p-3 rounded-xl shadow-inner">
        <div ref="qrContainer" class="w-32 h-32 md:w-48 md:h-48"></div>
      </div>

      <div
        v-if="showUrl"
        class="text-[10px] md:text-xs text-white font-bold opacity-60 truncate max-w-[150px]"
      >
        {{ displayUrl }}
      </div>
    </div>
  </BaseModule>
</template>

<script setup lang="ts">
import { BaseModule } from "../BaseModule";
import type { QRCodeModuleConfig } from "./index";
import QRCode from "qrcode";

const props = defineProps<QRCodeModuleConfig>();

const qrContainer = ref<HTMLElement | null>(null);
const qrUrl = ref("");
const displayUrl = ref("");

const updateQR = async () => {
  let url = "";
  if (props.type === "media-upload") {
    // Get server IP or hostname
    const host = window.location.hostname;
    const port = window.location.port;
    url = `http://${host}:${port}/manage/backgrounds`;
    displayUrl.value = `${host}/manage/backgrounds`;
  } else {
    url = props.customUrl || "";
    displayUrl.value = url.replace(/^https?:\/\//, "");
  }

  qrUrl.value = url;

  if (url && qrContainer.value) {
    qrContainer.value.innerHTML = "";
    const canvas = await QRCode.toCanvas(url, {
      width: qrContainer.value.clientWidth,
      margin: 0,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });
    qrContainer.value.appendChild(canvas);
  }
};

onMounted(() => {
  updateQR();
});

watch(() => [props.type, props.customUrl], updateQR);
</script>
