import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from 'boot/axios';

export interface SyncStatus {
  pending: number;
  syncing: number;
  synced: number;
  conflict: number;
  failed: number;
}

export const useSyncStore = defineStore('sync', () => {
  const status = ref<SyncStatus>({
    pending: 0,
    syncing: 0,
    synced: 0,
    conflict: 0,
    failed: 0,
  });
  const isOnline = ref(navigator.onLine);
  const lastSyncAt = ref<Date | null>(null);

  function updateOnlineStatus(online: boolean) {
    isOnline.value = online;
  }

  async function syncPending() {
    // TODO: Implementar sincronización con cola offline de Dexie
  }

  return {
    status,
    isOnline,
    lastSyncAt,
    updateOnlineStatus,
    syncPending,
  };
});
