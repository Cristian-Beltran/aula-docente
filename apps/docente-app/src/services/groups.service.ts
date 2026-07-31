import { api } from 'boot/axios';
import type { PaginatedResponse, PaginationParams, ClassGroup, GroupMembership } from './types';

function buildParams(params?: PaginationParams): Record<string, string | number> {
  const result: Record<string, string | number> = {};
  if (params?.page) result.page = params.page;
  if (params?.pageSize) result.pageSize = params.pageSize;
  if (params?.search) result.search = params.search;
  if (params?.sortBy) result.sortBy = params.sortBy;
  if (params?.sortOrder) result.sortOrder = params.sortOrder;
  return result;
}

export const groupsService = {
  listByCourse(courseId: string, params?: PaginationParams) {
    return api.get<PaginatedResponse<ClassGroup>>(`/groups/course/${courseId}`, {
      params: buildParams(params),
    });
  },

  getById(id: string) {
    return api.get<ClassGroup>(`/groups/${id}`);
  },

  create(data: Partial<ClassGroup>) {
    return api.post<ClassGroup>('/groups', data);
  },

  update(id: string, data: Partial<ClassGroup>) {
    return api.put<ClassGroup>(`/groups/${id}`, data);
  },

  remove(id: string) {
    return api.delete<{ id: string }>(`/groups/${id}`);
  },

  getMemberships(id: string, params?: PaginationParams) {
    return api.get<PaginatedResponse<GroupMembership>>(`/groups/${id}/memberships`, {
      params: buildParams(params),
    });
  },
};
