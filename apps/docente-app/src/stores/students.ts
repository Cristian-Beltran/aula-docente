import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Student, PaginationParams } from 'src/services/types';
import { studentsService } from 'src/services/students.service';

export const useStudentsStore = defineStore('students', () => {
  const items = ref<Student[]>([]);
  const selected = ref<Student | null>(null);
  const loading = ref(false);
  const total = ref(0);
  const page = ref(1);
  const pageSize = ref(20);

  async function fetchAll(params?: PaginationParams) {
    loading.value = true;
    try {
      const { data } = await studentsService.list(params);
      items.value = data.items;
      total.value = data.total;
      page.value = data.page;
      pageSize.value = data.pageSize;
    } catch {
      items.value = [];
    } finally {
      loading.value = false;
    }
  }

  async function fetchById(id: string) {
    loading.value = true;
    try {
      const { data } = await studentsService.getById(id);
      selected.value = data;
      return data;
    } catch {
      selected.value = null;
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function create(data: Partial<Student>) {
    loading.value = true;
    try {
      const { data: student } = await studentsService.create(data);
      items.value.unshift(student);
      return student;
    } finally {
      loading.value = false;
    }
  }

  async function update(id: string, data: Partial<Student>) {
    loading.value = true;
    try {
      const { data: student } = await studentsService.update(id, data);
      const idx = items.value.findIndex((s) => s.id === id);
      if (idx !== -1) items.value[idx] = student;
      if (selected.value?.id === id) selected.value = student;
      return student;
    } finally {
      loading.value = false;
    }
  }

  async function remove(id: string) {
    loading.value = true;
    try {
      await studentsService.remove(id);
      items.value = items.value.filter((s) => s.id !== id);
      if (selected.value?.id === id) selected.value = null;
    } finally {
      loading.value = false;
    }
  }

  return {
    items,
    selected,
    loading,
    total,
    page,
    pageSize,
    fetchAll,
    fetchById,
    create,
    update,
    remove,
  };
});
