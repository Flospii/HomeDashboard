<template>
    <header class="shadow-xl border-b light:border-neutral-200 dark:border-neutral-700">
        <div class="container mx-auto flex items-center justify-between px-4 py-4">
            <NuxtLink to="/" class="text-lg font-bold">
                {{ metadata.capitalizedSiteName }}
            </NuxtLink>
            <nav class="flex items-center space-x-4">
                <LanguageSwitcher />
                <ThemeToggle />
            </nav>
        </div>
    </header>
</template>

<script setup lang="ts">
import { useMetadataStore } from '~~/stores/metadata';

const metadata = useMetadataStore();
</script>
