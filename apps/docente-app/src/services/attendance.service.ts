import { api } from 'boot/axios';
import type { PaginatedResponse, PaginationParams, AttendanceRecord } from './types';

function buildParams(params?: PaginationParams): Record<string, string | number> {
  const result: Record<string, string | number> = {};
  if (params?.page) result.page = params.page;
  if (params?.pageSize) result.pageSize = params.pageSize;
  if (params?.search) result.search = params.search;
  if (params?.sortBy) result.sortBy = params.sortBy;
  if (params?.sortOrder) result.sortOrder = params.sortOrder;
  return result;
}

export const attendanceService = {
  listBySession(sessionId: string, params?: PaginationParams) {
    return api.get<PaginatedResponse<AttendanceRecord>>(`/attendance/session/${sessionId}`, {
      params: buildParams(params),
    });
  },

  create(data: Partial<AttendanceRecord>) {
    return api.post<AttendanceRecord>('/attendance', data);
  },

  update(id: string, data: Partial<AttendanceRecord>) {
    return api.put<AttendanceRecord>(`/attendance/${id}`, data);
  },
};
