import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { ClassGroup, GroupMembership, PaginationParams } from 'src/services/types';
import { groupsService } from 'src/services/groups.service';

export const useGroupsStore = defineStore('groups', () => {
  const items = ref<ClassGroup[]>([]);
  const selected = ref<ClassGroup | null>(null);
  const memberships = ref<GroupMembership[]>([]);
  const loading = ref(false);
  const total = ref(0);

  async function fetchByCourse(courseId: string, params?: PaginationParams) {
    loading.value = true;
    try {
      const { data } = await groupsService.listByCourse(courseId, params);
      items.value = data.items;
      total.value = data.total;
    } catch {
      items.value = [];
    } finally {
      loading.value = false;
    }
  }

  async function fetchById(id: string) {
    loading.value = true;
    try {
      const { data } = await groupsService.getById(id);
      selected.value = data;
      return data;
    } catch {
      selected.value = null;
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function create(data: Partial<ClassGroup>) {
    loading.value = true;
    try {
      const { data: group } = await groupsService.create(data);
      items.value.unshift(group);
      return group;
    } finally {
      loading.value = false;
    }
  }

  async function update(id: string, data: Partial<ClassGroup>) {
    loading.value = true;
    try {
      const { data: group } = await groupsService.update(id, data);
      const idx = items.value.findIndex((g) => g.id === id);
      if (idx !== -1) items.value[idx] = group;
      if (selected.value?.id === id) selected.value = group;
      return group;
    } finally {
      loading.value = false;
    }
  }

  async function remove(id: string) {
    loading.value = true;
    try {
      await groupsService.remove(id);
      items.value = items.value.filter((g) => g.id !== id);
      if (selected.value?.id === id) selected.value = null;
    } finally {
      loading.value = false;
    }
  }

  async function fetchMemberships(groupId: string, params?: PaginationParams) {
    loading.value = true;
    try {
      const { data } = await groupsService.getMemberships(groupId, params);
      memberships.value = data.items;
      return data;
    } finally {
      loading.value = false;
    }
  }

  return {
    items,
    selected,
    memberships,
    loading,
    total,
    fetchByCourse,
    fetchById,
    create,
    update,
    remove,
    fetchMemberships,
  };
});
