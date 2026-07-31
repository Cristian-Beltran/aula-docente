import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { AcademicPeriod } from 'src/services/types';
import { academicPeriodsService } from 'src/services/academic-periods.service';

export const useAcademicPeriodsStore = defineStore('academicPeriods', () => {
  const items = ref<AcademicPeriod[]>([]);
  const loading = ref(false);

  async function fetchAll() {
    loading.value = true;
    try {
      const { data } = await academicPeriodsService.list();
      items.value = data;
    } catch {
      items.value = [];
    } finally {
      loading.value = false;
    }
  }

  async function create(data: Partial<AcademicPeriod>) {
    loading.value = true;
    try {
      const { data: period } = await academicPeriodsService.create(data);
      items.value.unshift(period);
      return period;
    } finally {
      loading.value = false;
    }
  }

  async function update(id: string, data: Partial<AcademicPeriod>) {
    loading.value = true;
    try {
      const { data: period } = await academicPeriodsService.update(id, data);
      const idx = items.value.findIndex((p) => p.id === id);
      if (idx !== -1) items.value[idx] = period;
      return period;
    } finally {
      loading.value = false;
    }
  }

  async function remove(id: string) {
    loading.value = true;
    try {
      await academicPeriodsService.remove(id);
      items.value = items.value.filter((p) => p.id !== id);
    } finally {
      loading.value = false;
    }
  }

  return {
    items,
    loading,
    fetchAll,
    create,
    update,
    remove,
  };
});
