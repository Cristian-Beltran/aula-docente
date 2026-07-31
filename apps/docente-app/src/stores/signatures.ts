import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Activity, SignatureRecord, PaginationParams } from 'src/services/types';
import { signaturesService } from 'src/services/signatures.service';

export const useSignaturesStore = defineStore('signatures', () => {
  const activities = ref<Activity[]>([]);
  const records = ref<SignatureRecord[]>([]);
  const loading = ref(false);
  const total = ref(0);

  async function fetchActivitiesByCourse(courseId: string, params?: PaginationParams) {
    loading.value = true;
    try {
      const { data } = await signaturesService.listActivitiesByCourse(courseId, params);
      activities.value = data.items;
      total.value = data.total;
    } catch {
      activities.value = [];
    } finally {
      loading.value = false;
    }
  }

  async function create(data: Partial<SignatureRecord>) {
    loading.value = true;
    try {
      const { data: record } = await signaturesService.create(data);
      records.value.unshift(record);
      return record;
    } finally {
      loading.value = false;
    }
  }

  async function validateQr(token: string, courseId: string) {
    loading.value = true;
    try {
      const { data } = await signaturesService.validateQr(token, courseId);
      return data;
    } finally {
      loading.value = false;
    }
  }

  return {
    activities,
    records,
    loading,
    total,
    fetchActivitiesByCourse,
    create,
    validateQr,
  };
});
