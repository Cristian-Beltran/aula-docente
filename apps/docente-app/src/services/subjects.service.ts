import { api } from 'boot/axios';
import type { Subject } from './types';

export const subjectsService = {
  list() {
    return api.get<Subject[]>('/subjects');
  },

  getById(id: string) {
    return api.get<Subject>(`/subjects/${id}`);
  },

  create(data: Partial<Subject>) {
    return api.post<Subject>('/subjects', data);
  },

  update(id: string, data: Partial<Subject>) {
    return api.put<Subject>(`/subjects/${id}`, data);
  },

  remove(id: string) {
    return api.delete<{ id: string }>(`/subjects/${id}`);
  },
};
