import { api } from 'boot/axios';
import type {
  PaginatedResponse,
  PaginationParams,
  CourseSummary,
  GroupComparison,
  SignatureRecord,
  AttendanceRecord,
  RiskStudent,
  ExceptionRequest,
} from './types';

function buildParams(params?: PaginationParams): Record<string, string | number> {
  const result: Record<string, string | number> = {};
  if (params?.page) result.page = params.page;
  if (params?.pageSize) result.pageSize = params.pageSize;
  if (params?.search) result.search = params.search;
  if (params?.sortBy) result.sortBy = params.sortBy;
  if (params?.sortOrder) result.sortOrder = params.sortOrder;
  return result;
}

export const reportsService = {
  getCourseSummary(courseId: string) {
    return api.get<CourseSummary>(`/reports/courses/${courseId}/summary`);
  },

  getGroupsComparison(courseId: string, params?: PaginationParams) {
    return api.get<PaginatedResponse<GroupComparison>>(
      `/reports/courses/${courseId}/groups-comparison`,
      { params: buildParams(params) },
    );
  },

  getActivitySignatures(courseId: string, activityId: string, params?: PaginationParams) {
    return api.get<PaginatedResponse<SignatureRecord>>(
      `/reports/courses/${courseId}/activities/${activityId}/signatures`,
      { params: buildParams(params) },
    );
  },

  getSessionAttendance(courseId: string, sessionId: string, params?: PaginationParams) {
    return api.get<PaginatedResponse<AttendanceRecord>>(
      `/reports/courses/${courseId}/sessions/${sessionId}/attendance`,
      { params: buildParams(params) },
    );
  },

  getRiskStudents(courseId: string, params?: PaginationParams) {
    return api.get<PaginatedResponse<RiskStudent>>(
      `/reports/courses/${courseId}/risk-students`,
      { params: buildParams(params) },
    );
  },

  getCourseExceptions(courseId: string, params?: PaginationParams) {
    return api.get<PaginatedResponse<ExceptionRequest>>(
      `/reports/courses/${courseId}/exceptions`,
      { params: buildParams(params) },
    );
  },
};
