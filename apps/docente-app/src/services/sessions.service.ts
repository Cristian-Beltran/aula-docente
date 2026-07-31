import { api } from 'boot/axios';
import type { PaginatedResponse, PaginationParams, Lesson, ClassSession } from './types';

function buildParams(params?: PaginationParams): Record<string, string | number> {
  const result: Record<string, string | number> = {};
  if (params?.page) result.page = params.page;
  if (params?.pageSize) result.pageSize = params.pageSize;
  if (params?.search) result.search = params.search;
  if (params?.sortBy) result.sortBy = params.sortBy;
  if (params?.sortOrder) result.sortOrder = params.sortOrder;
  return result;
}

export const sessionsService = {
  listLessonsByCourse(courseId: string, params?: PaginationParams) {
    return api.get<PaginatedResponse<Lesson>>(`/lessons/course/${courseId}`, {
      params: buildParams(params),
    });
  },

  getLesson(id: string) {
    return api.get<Lesson>(`/lessons/${id}`);
  },

  createLesson(data: Partial<Lesson>) {
    return api.post<Lesson>('/lessons', data);
  },

  updateLesson(id: string, data: Partial<Lesson>) {
    return api.put<Lesson>(`/lessons/${id}`, data);
  },

  deleteLesson(id: string) {
    return api.delete<{ id: string }>(`/lessons/${id}`);
  },

  listSessionsByLesson(lessonId: string, params?: PaginationParams) {
    return api.get<PaginatedResponse<ClassSession>>(`/lessons/${lessonId}/sessions`, {
      params: buildParams(params),
    });
  },

  createSession(data: Partial<ClassSession>) {
    return api.post<ClassSession>('/lessons/sessions', data);
  },
};
