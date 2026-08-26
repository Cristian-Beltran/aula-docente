import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type {
  Activity,
  AttendanceStatus,
  ClassSession,
  Course,
  WorkflowAgenda,
  WorkflowGroup,
  WorkflowRoster,
  WorkflowWeekAgenda,
} from 'src/services/types';
import { teacherWorkflowService } from 'src/services/teacher-workflow.service';

export const useTeacherWorkflowStore = defineStore('teacher-workflow', () => {
  const agenda = ref<WorkflowAgenda | null>(null);
  const currentSession = ref<ClassSession | null>(null);
  const weekAgenda = ref<WorkflowWeekAgenda | null>(null);
  const roster = ref<WorkflowRoster | null>(null);
  const activities = ref<Activity[]>([]);
  const courses = ref<Course[]>([]);
  const groups = ref<WorkflowGroup[]>([]);
  const loading = ref(false);

  const activeActivity = computed(() => activities.value.find((item) => item.status === 'OPEN') || null);

  async function fetchToday(date?: string) {
    loading.value = true;
    try {
      const { data } = await teacherWorkflowService.getToday(date);
      agenda.value = data;
      currentSession.value = data.openSession;
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function fetchWeek(date?: string) {
    loading.value = true;
    try {
      const { data } = await teacherWorkflowService.getWeek(date);
      weekAgenda.value = data;
      currentSession.value = data.openSession;
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function fetchCurrentSession() {
    const { data } = await teacherWorkflowService.getCurrentSession();
    currentSession.value = data;
    return data;
  }

  async function fetchCourses() {
    const { data } = await teacherWorkflowService.listCourses();
    courses.value = data;
    return data;
  }

  async function fetchRoster(sessionId: string) {
    const { data } = await teacherWorkflowService.getRoster(sessionId);
    roster.value = data;
    return data;
  }

  async function fetchActivities(sessionId: string) {
    const { data } = await teacherWorkflowService.listActivities(sessionId);
    activities.value = data;
    return data;
  }

  async function openSession(sessionId: string) {
    const { data } = await teacherWorkflowService.openSession(sessionId);
    currentSession.value = data;
    return data;
  }

  async function cancelSession(sessionId: string) {
    const { data } = await teacherWorkflowService.cancelSession(sessionId);
    return data;
  }

  async function markAttendance(
    sessionId: string,
    enrollmentId: string,
    status: AttendanceStatus,
    justification?: string,
  ) {
    const { data } = await teacherWorkflowService.registerAttendance(sessionId, {
      enrollmentId,
      status,
      justification,
    });
    const item = roster.value?.items.find((row) => row.enrollmentId === enrollmentId);
    if (item) {
      item.status = status;
      item.justification = justification || '';
    }
    return data;
  }

  async function completeSession(sessionId: string, payload?: { logTopic?: string; logContent?: string }) {
    const { data } = await teacherWorkflowService.completeSession(sessionId, payload);
    currentSession.value = null;
    return data;
  }

  async function createActivity(
    sessionId: string,
    payload: { title: string; gradingMode: 'SCORE_0_100' | 'SIGNATURES'; maxSignatures?: number; notes?: string },
  ) {
    const { data } = await teacherWorkflowService.createActivity(sessionId, payload);
    activities.value.unshift(data);
    return data;
  }

  async function updateActivity(activityId: string, payload: Partial<Activity>) {
    const { data } = await teacherWorkflowService.updateActivity(activityId, payload);
    const index = activities.value.findIndex((item) => item.id === activityId);
    if (index >= 0) {
      activities.value[index] = data;
    }
    return data;
  }

  async function deleteActivity(activityId: string) {
    await teacherWorkflowService.deleteActivity(activityId);
    activities.value = activities.value.filter((item) => item.id !== activityId);
  }

  async function scanActivity(
    activityId: string,
    payload: { token?: string; enrollmentId?: string; score?: number; quantity?: number; comment?: string },
  ) {
    return teacherWorkflowService.scanActivity(activityId, payload);
  }

  async function fetchGroups(courseId: string) {
    const { data } = await teacherWorkflowService.listGroups(courseId);
    groups.value = data;
    return data;
  }

  return {
    agenda,
    weekAgenda,
    currentSession,
    roster,
    activities,
    courses,
    groups,
    loading,
    activeActivity,
    fetchToday,
    fetchWeek,
    fetchCurrentSession,
    fetchCourses,
    fetchRoster,
    fetchActivities,
    openSession,
    cancelSession,
    markAttendance,
    completeSession,
    createActivity,
    updateActivity,
    deleteActivity,
    scanActivity,
    fetchGroups,
  };
});
