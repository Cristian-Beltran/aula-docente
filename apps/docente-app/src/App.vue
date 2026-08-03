<template>
  <router-view />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'stores/auth';
import { useSyncStore } from 'stores/sync';

const router = useRouter();
const authStore = useAuthStore();
const syncStore = useSyncStore();
let handleOnline: (() => void) | null = null;
let handleOffline: (() => void) | null = null;
let handleSessionExpired: (() => void) | null = null;

onMounted(() => {
  void authStore.initialize();

  handleOnline = () => syncStore.updateOnlineStatus(true);
  handleOffline = () => syncStore.updateOnlineStatus(false);
  handleSessionExpired = () => {
    void router.replace({ name: 'login-page', query: { reason: 'expired' } });
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  window.addEventListener('auth:session-expired', handleSessionExpired);
});

onBeforeUnmount(() => {
  if (handleOnline) {
    window.removeEventListener('online', handleOnline);
  }
  if (handleOffline) {
    window.removeEventListener('offline', handleOffline);
  }
  if (handleSessionExpired) {
    window.removeEventListener('auth:session-expired', handleSessionExpired);
  }
});
</script>
