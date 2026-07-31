import { api } from 'boot/axios';
import type { PaginatedResponse, PaginationParams, Student } from './types';

function buildParams(params?: PaginationParams): Record<string, string | number> {
  const result: Record<string, string | number> = {};
  if (params?.page) result.page = params.page;
  if (params?.pageSize) result.pageSize = params.pageSize;
  if (params?.search) result.search = params.search;
  if (params?.sortBy) result.sortBy = params.sortBy;
  if (params?.sortOrder) result.sortOrder = params.sortOrder;
  return result;
}

export const studentsService = {
  list(params?: PaginationParams) {
    return api.get<PaginatedResponse<Student>>('/students', { params: buildParams(params) });
  },

  getById(id: string) {
    return api.get<Student>(`/students/${id}`);
  },

  create(data: Partial<Student>) {
    return api.post<Student>('/students', data);
  },

  update(id: string, data: Partial<Student>) {
    return api.put<Student>(`/students/${id}`, data);
  },

  remove(id: string) {
    return api.delete<{ id: string }>(`/students/${id}`);
  },
};
