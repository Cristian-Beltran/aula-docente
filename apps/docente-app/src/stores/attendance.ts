import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { AttendanceRecord, PaginationParams } from 'src/services/types';
import { attendanceService } from 'src/services/attendance.service';

export const useAttendanceStore = defineStore('attendance', () => {
  const records = ref<AttendanceRecord[]>([]);
  const loading = ref(false);
  const total = ref(0);

  async function fetchBySession(sessionId: string, params?: PaginationParams) {
    loading.value = true;
    try {
      const { data } = await attendanceService.listBySession(sessionId, params);
      records.value = data.items;
      total.value = data.total;
    } catch {
      records.value = [];
    } finally {
      loading.value = false;
    }
  }

  async function create(data: Partial<AttendanceRecord>) {
    loading.value = true;
    try {
      const { data: record } = await attendanceService.create(data);
      records.value.unshift(record);
      return record;
    } finally {
      loading.value = false;
    }
  }

  async function update(id: string, data: Partial<AttendanceRecord>) {
    loading.value = true;
    try {
      const { data: record } = await attendanceService.update(id, data);
      const idx = records.value.findIndex((r) => r.id === id);
      if (idx !== -1) records.value[idx] = record;
      return record;
    } finally {
      loading.value = false;
    }
  }

  return {
    records,
    loading,
    total,
    fetchBySession,
    create,
    update,
  };
});
