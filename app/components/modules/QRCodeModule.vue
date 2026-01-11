<template>
    <BaseModule>
        <div class="flex flex-col items-center justify-center text-white space-y-4">
            <div v-if="title" class="text-xl font-bold tracking-tight opacity-90 uppercase">
                {{ title }}
            </div>
            <div class="p-4 bg-white rounded-2xl shadow-2xl">
                <qrcode-vue :value="qrValue" :size="qrSize" level="H" render-as="svg" background="#ffffff"
                    foreground="#000000" :margin="0" />
            </div>
            <div v-if="type === 'media-upload'" class="text-xs font-medium opacity-50 uppercase tracking-widest">
                {{ $t("manage.tabs.backgrounds") }}
            </div>
        </div>
    </BaseModule>
</template>

<script setup lang="ts">
import QrcodeVue from "qrcode.vue";
import BaseModule from "./BaseModule.vue";
import type { QRCodeModuleConfig } from "../../types/config";

const props = defineProps<QRCodeModuleConfig>();

const qrSize = ref(180);

const qrValue = computed(() => {
    if (props.type === "media-upload") {
        if (process.client) {
            return `${window.location.origin}/manage`;
        }
        return "/manage";
    }
    return props.customUrl || "";
});

// Adjust size on mobile
onMounted(() => {
    if (window.innerWidth < 768) {
        qrSize.value = 140;
    }
});
</script>

<style scoped>
/* Any additional styling if needed */
</style>
