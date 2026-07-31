import { api } from 'boot/axios';
import type { AcademicPeriod } from './types';

export const academicPeriodsService = {
  list() {
    return api.get<AcademicPeriod[]>('/academic-periods');
  },

  getById(id: string) {
    return api.get<AcademicPeriod>(`/academic-periods/${id}`);
  },

  create(data: Partial<AcademicPeriod>) {
    return api.post<AcademicPeriod>('/academic-periods', data);
  },

  update(id: string, data: Partial<AcademicPeriod>) {
    return api.put<AcademicPeriod>(`/academic-periods/${id}`, data);
  },

  remove(id: string) {
    return api.delete<{ id: string }>(`/academic-periods/${id}`);
  },
};
