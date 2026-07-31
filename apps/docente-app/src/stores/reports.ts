import { defineStore } from 'pinia';
import { ref } from 'vue';
import type {
  CourseSummary,
  GroupComparison,
  RiskStudent,
  SignatureRecord,
  AttendanceRecord,
  ExceptionRequest,
  PaginationParams,
} from 'src/services/types';
import { reportsService } from 'src/services/reports.service';

export const useReportsStore = defineStore('reports', () => {
  const summary = ref<CourseSummary | null>(null);
  const groupComparison = ref<GroupComparison[]>([]);
  const riskStudents = ref<RiskStudent[]>([]);
  const activitySignatures = ref<SignatureRecord[]>([]);
  const sessionAttendance = ref<AttendanceRecord[]>([]);
  const courseExceptions = ref<ExceptionRequest[]>([]);
  const loadingSummary = ref(false);
  const loadingExceptions = ref(false);
  const loadingComparison = ref(false);

  async function fetchSummary(courseId: string) {
    loadingSummary.value = true;
    try {
      const { data } = await reportsService.getCourseSummary(courseId);
      summary.value = data;
      return data;
    } finally {
      loadingSummary.value = false;
    }
  }

  async function fetchGroupsComparison(courseId: string, params?: PaginationParams) {
    loadingComparison.value = true;
    try {
      const { data } = await reportsService.getGroupsComparison(courseId, params);
      groupComparison.value = data.items;
    } finally {
      loadingComparison.value = false;
    }
  }

  async function fetchRiskStudents(courseId: string, params?: PaginationParams) {
    try {
      const { data } = await reportsService.getRiskStudents(courseId, params);
      riskStudents.value = data.items;
    } finally {
    }
  }

  async function fetchActivitySignatures(
    courseId: string,
    activityId: string,
    params?: PaginationParams,
  ) {
    try {
      const { data } = await reportsService.getActivitySignatures(courseId, activityId, params);
      activitySignatures.value = data.items;
    } finally {
    }
  }

  async function fetchSessionAttendance(
    courseId: string,
    sessionId: string,
    params?: PaginationParams,
  ) {
    try {
      const { data } = await reportsService.getSessionAttendance(courseId, sessionId, params);
      sessionAttendance.value = data.items;
    } finally {
    }
  }

  async function fetchCourseExceptions(courseId: string, params?: PaginationParams) {
    loadingExceptions.value = true;
    try {
      const { data } = await reportsService.getCourseExceptions(courseId, params);
      courseExceptions.value = data.items;
    } finally {
      loadingExceptions.value = false;
    }
  }

  async function hydrateCourseDashboard(courseId: string) {
    await Promise.all([
      fetchSummary(courseId),
      fetchGroupsComparison(courseId),
      fetchRiskStudents(courseId),
      fetchCourseExceptions(courseId),
    ]);
  }

  function clear() {
    summary.value = null;
    groupComparison.value = [];
    riskStudents.value = [];
    activitySignatures.value = [];
    sessionAttendance.value = [];
    courseExceptions.value = [];
  }

  return {
    summary,
    groupComparison,
    riskStudents,
    activitySignatures,
    sessionAttendance,
    courseExceptions,
    loadingSummary,
    loadingExceptions,
    loadingComparison,
    fetchSummary,
    fetchGroupsComparison,
    fetchRiskStudents,
    fetchActivitySignatures,
    fetchSessionAttendance,
    fetchCourseExceptions,
    hydrateCourseDashboard,
    clear,
  };
});
