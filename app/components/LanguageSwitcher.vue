<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { availableLocales, locale: currentLocale, setLocale } = useI18n()
const selectedLocale = ref(currentLocale.value)
const popoverOpen = ref(false)

watch(selectedLocale, async (newLocale) => {
    await setLocale(newLocale)
    popoverOpen.value = false // close popup after selection
})
</script>

<template>
    <UPopover v-model:open="popoverOpen">
        <UButton icon="i-radix-icons:globe" variant="ghost">
            {{ selectedLocale.toUpperCase() }}
        </UButton>
        <template #content>
            <div class="flex flex-col gap-2 p-2">
                <UButton v-for="locale in availableLocales" :key="locale"
                    :color="selectedLocale === locale ? 'primary' : 'gray'" variant="ghost"
                    @click="selectedLocale = locale">
                    {{ locale.toUpperCase() }}
                </UButton>
            </div>
        </template>
    </UPopover>
</template>