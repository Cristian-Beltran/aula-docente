import { api } from 'boot/axios';
import type { PaginatedResponse, PaginationParams, Activity, SignatureRecord } from './types';

function buildParams(params?: PaginationParams): Record<string, string | number> {
  const result: Record<string, string | number> = {};
  if (params?.page) result.page = params.page;
  if (params?.pageSize) result.pageSize = params.pageSize;
  if (params?.search) result.search = params.search;
  if (params?.sortBy) result.sortBy = params.sortBy;
  if (params?.sortOrder) result.sortOrder = params.sortOrder;
  return result;
}

export const signaturesService = {
  listActivitiesByCourse(courseId: string, params?: PaginationParams) {
    return api.get<PaginatedResponse<Activity>>(`/signatures/course/${courseId}`, {
      params: buildParams(params),
    });
  },

  create(data: Partial<SignatureRecord>) {
    return api.post<SignatureRecord>('/signatures', data);
  },

  validateQr(token: string, courseId: string) {
    return api.post<unknown>('/signatures/validate-qr', { token, courseId });
  },
};
