import { api } from 'boot/axios';
import type { PaginatedResponse, PaginationParams, Course, Enrollment } from './types';

function buildParams(params?: PaginationParams): Record<string, string | number> {
  const result: Record<string, string | number> = {};
  if (params?.page) result.page = params.page;
  if (params?.pageSize) result.pageSize = params.pageSize;
  if (params?.search) result.search = params.search;
  if (params?.sortBy) result.sortBy = params.sortBy;
  if (params?.sortOrder) result.sortOrder = params.sortOrder;
  return result;
}

export const coursesService = {
  list(params?: PaginationParams) {
    return api.get<PaginatedResponse<Course>>('/courses', { params: buildParams(params) });
  },

  getById(id: string) {
    return api.get<Course>(`/courses/${id}`);
  },

  create(data: Partial<Course>) {
    return api.post<Course>('/courses', data);
  },

  update(id: string, data: Partial<Course>) {
    return api.put<Course>(`/courses/${id}`, data);
  },

  remove(id: string) {
    return api.delete<{ id: string }>(`/courses/${id}`);
  },

  getEnrollments(id: string, params?: PaginationParams) {
    return api.get<PaginatedResponse<Enrollment>>(`/courses/${id}/enrollments`, {
      params: buildParams(params),
    });
  },
};
