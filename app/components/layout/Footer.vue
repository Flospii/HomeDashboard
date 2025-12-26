<!-- components/layout/Footer.vue -->
<template>
    <UCard class="rounded-none border-t light:border-neutral-200 dark:border-neutral-700" body-class="px-6 py-4">
        <div class="text-center space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-4">
                <p class="text-primary">
                    {{ t('footer.text') }}
                </p>
                <div class="flex gap-3 justify-center">
                    <UButton v-if="metadata.getInstagramLink" :to="metadata.getInstagramLink" target="_blank"
                        icon="i-mdi-instagram" variant="ghost" color="primary" />
                    <UButton v-if="metadata.getLinkedInLink" :to="metadata.getLinkedInLink" target="_blank"
                        icon="i-mdi-linkedin" variant="ghost" color="primary" />
                </div>
            </div>
            <div class="text-sm text-gray-500">
                © {{ currentYear }} — {{ metadata.capitalizedSiteName }}
            </div>
        </div>
    </UCard>
</template>

<script setup lang="ts">
import { useMetadataStore } from '~~/stores/metadata';
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const metadata = useMetadataStore()
const currentYear = new Date().getFullYear()
</script>
