<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useAuthStore } from 'stores/auth';
import { useSyncStore } from 'stores/sync';

const authStore = useAuthStore();
const syncStore = useSyncStore();

onMounted(() => {
  void authStore.initialize();

  window.addEventListener('online', () => syncStore.updateOnlineStatus(true));
  window.addEventListener('offline', () => syncStore.updateOnlineStatus(false));
});
</script>
