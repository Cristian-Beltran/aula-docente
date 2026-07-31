import { api } from 'boot/axios';
import type {
  Activity,
  AttendanceStatus,
  ClassSession,
  Course,
  Student,
  WorkflowAdditionalSessionsPage,
  WorkflowAgenda,
  WorkflowGroup,
  WorkflowRoster,
  WorkflowStudentPage,
  WorkflowStudentResult,
  WorkflowSessionDetail,
  WorkflowWeekAgenda,
} from './types';

export const teacherWorkflowService = {
  getToday(date?: string) {
    return api.get<WorkflowAgenda>('/teacher-workflow/today', {
      params: date ? { date } : undefined,
    });
  },

  getWeek(date?: string) {
    return api.get<WorkflowWeekAgenda>('/teacher-workflow/week', {
      params: date ? { date } : undefined,
    });
  },

  getCurrentSession() {
    return api.get<ClassSession | null>('/teacher-workflow/current-session');
  },

  listCourses() {
    return api.get<Course[]>('/teacher-workflow/courses');
  },

  createCourse(data: Partial<Course> & { name: string }) {
    return api.post<Course>('/teacher-workflow/courses', data);
  },

  updateCourse(id: string, data: Partial<Course>) {
    return api.put<Course>(`/teacher-workflow/courses/${id}`, data);
  },

  deleteCourse(id: string) {
    return api.delete(`/teacher-workflow/courses/${id}`);
  },

  saveSchedule(courseId: string, schedule: Record<string, unknown>[]) {
    return api.put<Course>(`/teacher-workflow/courses/${courseId}/schedule`, { schedule });
  },

  createAdditionalSession(courseId: string, data: Partial<ClassSession>) {
    return api.post<ClassSession>(`/teacher-workflow/courses/${courseId}/additional-sessions`, data);
  },

  listAdditionalSessions(courseId: string, page = 1, search?: string) {
    return api.get<WorkflowAdditionalSessionsPage>(
      `/teacher-workflow/courses/${courseId}/additional-sessions`,
      { params: { page, search } },
    );
  },

  updateAdditionalSession(sessionId: string, data: Partial<ClassSession>) {
    return api.put<ClassSession>(`/teacher-workflow/additional-sessions/${sessionId}`, data);
  },

  deleteAdditionalSession(sessionId: string) {
    return api.delete(`/teacher-workflow/additional-sessions/${sessionId}`);
  },

  listCourseStudents(courseId: string, page = 1, search?: string, pageSize?: number) {
    return api.get<WorkflowStudentPage>(`/teacher-workflow/courses/${courseId}/students`, {
      params: { page, search, pageSize },
    });
  },

  getQrCards(courseId: string, options?: { enrollmentId?: string; search?: string }) {
    return api.get<WorkflowStudentResult[]>(`/teacher-workflow/courses/${courseId}/qr-cards`, {
      params: options,
    });
  },

  downloadQrPdf(courseId: string) {
    return api.get(`/teacher-workflow/courses/${courseId}/qr-pdf`, {
      responseType: 'blob',
    });
  },

  registerStudent(courseId: string, fullName: string) {
    return api.post<WorkflowStudentResult>(`/teacher-workflow/courses/${courseId}/students`, { fullName });
  },

  bulkRegisterStudents(courseId: string, fullNames: string[]) {
    return api.post<{ created: WorkflowStudentResult[] }>(
      `/teacher-workflow/courses/${courseId}/students/bulk`,
      { fullNames },
    );
  },

  updateStudent(courseId: string, enrollmentId: string, data: { firstName?: string; lastName?: string; studentCode?: string }) {
    return api.put<WorkflowStudentResult>(`/teacher-workflow/courses/${courseId}/students/${enrollmentId}`, data);
  },

  removeStudent(courseId: string, enrollmentId: string) {
    return api.delete(`/teacher-workflow/courses/${courseId}/students/${enrollmentId}`);
  },

  listGroups(courseId: string) {
    return api.get<WorkflowGroup[]>(`/teacher-workflow/courses/${courseId}/groups`);
  },

  createGroup(
    courseId: string,
    data: { name: string; code?: string; schedule?: Record<string, unknown>[]; enrollmentIds?: string[] },
  ) {
    return api.post<WorkflowGroup>(`/teacher-workflow/courses/${courseId}/groups`, data);
  },

  updateGroup(
    courseId: string,
    groupId: string,
    data: { name?: string; code?: string; schedule?: Record<string, unknown>[] },
  ) {
    return api.put<WorkflowGroup>(`/teacher-workflow/courses/${courseId}/groups/${groupId}`, data);
  },

  deleteGroup(courseId: string, groupId: string) {
    return api.delete(`/teacher-workflow/courses/${courseId}/groups/${groupId}`);
  },

  replaceGroupMembers(courseId: string, groupId: string, enrollmentIds: string[]) {
    return api.put<WorkflowGroup[]>(`/teacher-workflow/courses/${courseId}/groups/${groupId}/members`, {
      enrollmentIds,
    });
  },

  openSession(sessionId: string) {
    return api.post<ClassSession>(`/teacher-workflow/sessions/${sessionId}/open`);
  },

  getRoster(sessionId: string) {
    return api.get<WorkflowRoster>(`/teacher-workflow/sessions/${sessionId}/roster`);
  },

  getSessionDetail(sessionId: string) {
    return api.get<WorkflowSessionDetail>(`/teacher-workflow/sessions/${sessionId}`);
  },

  registerAttendance(
    sessionId: string,
    data: { enrollmentId: string; status: AttendanceStatus; justification?: string },
  ) {
    return api.post(`/teacher-workflow/sessions/${sessionId}/attendance`, data);
  },

  updateSessionLog(sessionId: string, data: { logTopic?: string; logContent?: string }) {
    return api.patch<ClassSession>(`/teacher-workflow/sessions/${sessionId}/log`, data);
  },

  updateSessionPartial(sessionId: string, partial: number) {
    return api.patch<ClassSession>(`/teacher-workflow/sessions/${sessionId}/partial`, { partial });
  },

  completeSession(sessionId: string, data?: { logTopic?: string; logContent?: string }) {
    return api.post<ClassSession>(`/teacher-workflow/sessions/${sessionId}/complete`, data || {});
  },

  listActivities(sessionId: string) {
    return api.get<Activity[]>(`/teacher-workflow/sessions/${sessionId}/activities`);
  },

  createActivity(
    sessionId: string,
    data: {
      title: string;
      gradingMode: 'SCORE_0_100' | 'SIGNATURES';
      maxSignatures?: number;
      notes?: string;
    },
  ) {
    return api.post<Activity>(`/teacher-workflow/sessions/${sessionId}/activities`, data);
  },

  updateActivity(activityId: string, data: Partial<Activity>) {
    return api.patch<Activity>(`/teacher-workflow/activities/${activityId}`, data);
  },

  deleteActivity(activityId: string) {
    return api.delete(`/teacher-workflow/activities/${activityId}`);
  },

  scanActivity(
    activityId: string,
    data: { token?: string; enrollmentId?: string; score?: number; quantity?: number; comment?: string },
  ) {
    return api.post<{ activity: Activity; student: Student }>(
      `/teacher-workflow/activities/${activityId}/scan`,
      data,
    );
  },
};
