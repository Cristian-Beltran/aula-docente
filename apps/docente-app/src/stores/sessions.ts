import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Lesson, ClassSession, PaginationParams } from 'src/services/types';
import { sessionsService } from 'src/services/sessions.service';

export const useSessionsStore = defineStore('sessions', () => {
  const lessons = ref<Lesson[]>([]);
  const sessions = ref<ClassSession[]>([]);
  const selectedLesson = ref<Lesson | null>(null);
  const selectedSession = ref<ClassSession | null>(null);
  const loading = ref(false);
  const total = ref(0);

  async function fetchLessonsByCourse(courseId: string, params?: PaginationParams) {
    loading.value = true;
    try {
      const { data } = await sessionsService.listLessonsByCourse(courseId, params);
      lessons.value = data.items;
      total.value = data.total;
    } catch {
      lessons.value = [];
    } finally {
      loading.value = false;
    }
  }

  async function fetchLesson(id: string) {
    loading.value = true;
    try {
      const { data } = await sessionsService.getLesson(id);
      selectedLesson.value = data;
      return data;
    } catch {
      selectedLesson.value = null;
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function createLesson(data: Partial<Lesson>) {
    loading.value = true;
    try {
      const { data: lesson } = await sessionsService.createLesson(data);
      lessons.value.unshift(lesson);
      return lesson;
    } finally {
      loading.value = false;
    }
  }

  async function updateLesson(id: string, data: Partial<Lesson>) {
    loading.value = true;
    try {
      const { data: lesson } = await sessionsService.updateLesson(id, data);
      const idx = lessons.value.findIndex((l) => l.id === id);
      if (idx !== -1) lessons.value[idx] = lesson;
      if (selectedLesson.value?.id === id) selectedLesson.value = lesson;
      return lesson;
    } finally {
      loading.value = false;
    }
  }

  async function deleteLesson(id: string) {
    loading.value = true;
    try {
      await sessionsService.deleteLesson(id);
      lessons.value = lessons.value.filter((l) => l.id !== id);
      if (selectedLesson.value?.id === id) selectedLesson.value = null;
    } finally {
      loading.value = false;
    }
  }

  async function fetchSessionsByLesson(lessonId: string, params?: PaginationParams) {
    loading.value = true;
    try {
      const { data } = await sessionsService.listSessionsByLesson(lessonId, params);
      sessions.value = data.items;
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function createSession(data: Partial<ClassSession>) {
    loading.value = true;
    try {
      const { data: session } = await sessionsService.createSession(data);
      sessions.value.unshift(session);
      return session;
    } finally {
      loading.value = false;
    }
  }

  return {
    lessons,
    sessions,
    selectedLesson,
    selectedSession,
    loading,
    total,
    fetchLessonsByCourse,
    fetchLesson,
    createLesson,
    updateLesson,
    deleteLesson,
    fetchSessionsByLesson,
    createSession,
  };
});
