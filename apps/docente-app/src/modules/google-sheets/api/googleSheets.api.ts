import { api } from 'boot/axios';

export interface GoogleSheetsStatus {
  configured: boolean;
  projectId?: string;
  clientEmail?: string;
  shareWithEmail?: string;
  status?: string;
  lastValidatedAt?: string;
}

export interface CourseSheetStatus {
  configured: boolean;
  status: string;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  spreadsheetName?: string;
  lastSyncedAt?: string;
  lastSyncedClassId?: string;
  lastError?: string;
  templateVersion?: number;
}

export const googleSheetsApi = {
  getStatus(): Promise<{ data: GoogleSheetsStatus }> {
    return api.get('/integrations/google-sheets/status');
  },

  saveCredentials(data: { projectId: string; clientEmail: string; privateKey: string; shareWithEmail?: string }) {
    return api.put('/integrations/google-sheets/credentials', data);
  },

  testConnection() {
    return api.post('/integrations/google-sheets/test');
  },

  removeCredentials() {
    return api.delete('/integrations/google-sheets/credentials');
  },

  getCourseSheet(courseId: string): Promise<{ data: CourseSheetStatus }> {
    return api.get(`/courses/${courseId}/google-sheet`);
  },

  createCourseSheet(courseId: string) {
    return api.post(`/courses/${courseId}/google-sheet`);
  },

  linkCourseSheet(courseId: string, spreadsheetId: string) {
    return api.post(`/courses/${courseId}/google-sheet/link`, { spreadsheetId });
  },

  syncCourseSheet(courseId: string) {
    return api.post(`/courses/${courseId}/google-sheet/sync`);
  },

  rebuildCourseSheet(courseId: string) {
    return api.post(`/courses/${courseId}/google-sheet/rebuild`);
  },

  unlinkCourseSheet(courseId: string) {
    return api.delete(`/courses/${courseId}/google-sheet`);
  },
};
