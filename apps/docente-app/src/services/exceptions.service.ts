import { api } from 'boot/axios';
import type { PaginatedResponse, PaginationParams, ExceptionRequest, Attachment } from './types';

function buildParams(params?: PaginationParams & { status?: string }): Record<string, string | number> {
  const result: Record<string, string | number> = {};
  if (params?.page) result.page = params.page;
  if (params?.pageSize) result.pageSize = params.pageSize;
  if (params?.search) result.search = params.search;
  if (params?.sortBy) result.sortBy = params.sortBy;
  if (params?.sortOrder) result.sortOrder = params.sortOrder;
  if (params?.status) result.status = params.status;
  return result;
}

export const exceptionsService = {
  listByCourse(courseId: string, params?: PaginationParams & { status?: string }) {
    return api.get<PaginatedResponse<ExceptionRequest>>(`/exceptions/course/${courseId}`, {
      params: buildParams(params),
    });
  },

  getById(id: string) {
    return api.get<ExceptionRequest>(`/exceptions/${id}`);
  },

  create(data: Partial<ExceptionRequest>) {
    return api.post<ExceptionRequest>('/exceptions', data);
  },

  resolve(id: string, status: string, resolutionNote: string) {
    return api.put<ExceptionRequest>(`/exceptions/${id}/resolve`, { status, resolutionNote });
  },

  createAttachment(data: Partial<Attachment>) {
    return api.post<Attachment>('/exceptions/attachments', data);
  },
};
