import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { ExceptionRequest, PaginationParams } from 'src/services/types';
import { exceptionsService } from 'src/services/exceptions.service';

export const useExceptionsStore = defineStore('exceptions', () => {
  const items = ref<ExceptionRequest[]>([]);
  const selected = ref<ExceptionRequest | null>(null);
  const loading = ref(false);
  const resolvingId = ref<string | null>(null);

  async function fetchByCourse(
    courseId: string,
    params?: PaginationParams & { status?: string },
  ) {
    loading.value = true;
    try {
      const { data } = await exceptionsService.listByCourse(courseId, params);
      items.value = data.items;
    } catch {
      items.value = [];
    } finally {
      loading.value = false;
    }
  }

  async function fetchById(id: string) {
    loading.value = true;
    try {
      const { data } = await exceptionsService.getById(id);
      selected.value = data;
      return data;
    } catch {
      selected.value = null;
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function createException(data: Partial<ExceptionRequest>) {
    loading.value = true;
    try {
      const { data: exception } = await exceptionsService.create(data);
      items.value.unshift(exception);
      return exception;
    } finally {
      loading.value = false;
    }
  }

  async function resolveException(
    courseId: string,
    exceptionId: string,
    status: 'APPROVED' | 'REJECTED',
  ) {
    resolvingId.value = exceptionId;
    try {
      const note = status === 'APPROVED' ? 'Aprobada desde el sistema' : 'Rechazada desde el sistema';
      const { data: exception } = await exceptionsService.resolve(exceptionId, status, note);
      const idx = items.value.findIndex((e) => e.id === exceptionId);
      if (idx !== -1) items.value[idx] = exception;
      if (selected.value?.id === exceptionId) selected.value = exception;
      return exception;
    } finally {
      resolvingId.value = null;
    }
  }

  return {
    items,
    selected,
    loading,
    resolvingId,
    fetchByCourse,
    fetchById,
    createException,
    resolveException,
  };
});
