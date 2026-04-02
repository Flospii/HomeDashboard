<template>
  <div class="min-h-screen flex items-center justify-center bg-(--ui-bg) p-4">
    <UCard class="w-full max-w-md shadow-2xl border border-primary-500/20 antialiased" :ui="{ root: 'bg-default/50 backdrop-blur-xl' }">
      <template #header>
        <div class="flex items-center space-x-3 mb-2">
          <div class="w-10 h-10 bg-primary-500 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)]">
            <UIcon name="i-heroicons-lock-closed" class="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 class="text-xl font-bold tracking-tight uppercase leading-tight">Admin Login</h1>
            <p class="text-[10px] uppercase tracking-[0.2em] text-primary-400 font-black">Authentication Required</p>
          </div>
        </div>
      </template>

      <form @submit.prevent="handleLogin" class="space-y-6">
        <UFormField label="Email" name="email">
          <UInput
            v-model="email"
            type="email"
            icon="i-heroicons-envelope"
            placeholder="admin@example.com"
            class="w-full"
            required
            autofocus
          />
        </UFormField>

        <UFormField label="Password" name="password">
          <UInput
            v-model="password"
            type="password"
            icon="i-heroicons-key"
            placeholder="••••••••"
            class="w-full"
            required
          />
        </UFormField>

        <div v-if="errorMsg" class="text-error-500 text-sm font-medium p-2 bg-error-500/10 rounded border border-error-500/20">
          {{ errorMsg }}
        </div>

        <UButton
          type="submit"
          color="primary"
          block
          :loading="loading"
          size="lg"
          icon="i-heroicons-arrow-right-on-rectangle"
        >
          Sign In
        </UButton>
      </form>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const email = ref('');
const password = ref('');
const loading = ref(false);
const errorMsg = ref('');
const { login } = useDirectusAuth();

const handleLogin = async () => {
  loading.value = true;
  errorMsg.value = '';
  try {
    await login({ email: email.value, password: password.value });
    const router = useRouter();
    router.push('/manage');
  } catch (err: any) {
    console.error('Login error:', err);
    errorMsg.value = err.message || 'Invalid credentials. Please try again.';
  } finally {
    loading.value = false;
  }
};
</script>
