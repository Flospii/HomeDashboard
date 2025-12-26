<template>
  <ClientOnly v-if="!colorMode?.forced">
    <UButton :key="colorMode.value" :label="isDark ? 'Dark Mode' : 'Light Mode'"
      :icon="isDark ? 'radix-icons:moon' : 'radix-icons:sun'" variant="ghost" @click="toggleTheme" />

    <template #fallback>
      <div class="size-8" />
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
const colorMode = useColorMode();

const isDark = computed({
  get() {
    return colorMode.value === 'dark'
  },
  set(_isDark) {
    colorMode.preference = _isDark ? 'dark' : 'light'
  }
})

const toggleTheme = () => {
  isDark.value = !isDark.value
}
</script>
