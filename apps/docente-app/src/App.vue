<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'stores/auth';
import { useSyncStore } from 'stores/sync';

const router = useRouter();
const authStore = useAuthStore();
const syncStore = useSyncStore();

onMounted(() => {
  void authStore.initialize();

  window.addEventListener('online', () => syncStore.updateOnlineStatus(true));
  window.addEventListener('offline', () => syncStore.updateOnlineStatus(false));

  window.addEventListener('auth:session-expired', () => {
    void router.push({ name: 'login' });
  });
});
</script>
