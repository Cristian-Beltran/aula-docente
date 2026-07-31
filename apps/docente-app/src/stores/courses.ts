import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Course, Enrollment, PaginationParams } from 'src/services/types';
import { coursesService } from 'src/services/courses.service';

export const useCoursesStore = defineStore('courses', () => {
  const items = ref<Course[]>([]);
  const selected = ref<Course | null>(null);
  const selectedCourseId = ref<string | null>(null);
  const enrollments = ref<Enrollment[]>([]);
  const loadingList = ref(false);
  const loadingDetail = ref(false);
  const loadingEnrollments = ref(false);
  const listError = ref<string | null>(null);

  const selectedCourse = computed(() => selected.value);

  async function fetchCourses(search?: string) {
    loadingList.value = true;
    listError.value = null;
    try {
      const params: PaginationParams = {};
      if (search) params.search = search;
      const { data } = await coursesService.list(params);
      items.value = data.items;
    } catch (err: any) {
      listError.value = err?.response?.data?.message || 'Error al cargar cursos';
      items.value = [];
    } finally {
      loadingList.value = false;
    }
  }

  function setSelectedCourse(id: string) {
    selectedCourseId.value = id;
  }

  async function fetchCourseDetail(id: string) {
    loadingDetail.value = true;
    try {
      const { data } = await coursesService.getById(id);
      selected.value = data;
      return data;
    } catch {
      selected.value = null;
      return null;
    } finally {
      loadingDetail.value = false;
    }
  }

  async function createCourse(data: Partial<Course>) {
    loadingDetail.value = true;
    try {
      const { data: course } = await coursesService.create(data);
      items.value.unshift(course);
      return course;
    } finally {
      loadingDetail.value = false;
    }
  }

  async function updateCourse(id: string, data: Partial<Course>) {
    loadingDetail.value = true;
    try {
      const { data: course } = await coursesService.update(id, data);
      const idx = items.value.findIndex((c) => c.id === id);
      if (idx !== -1) items.value[idx] = course;
      if (selected.value?.id === id) selected.value = course;
      return course;
    } finally {
      loadingDetail.value = false;
    }
  }

  async function deleteCourse(id: string) {
    loadingDetail.value = true;
    try {
      await coursesService.remove(id);
      items.value = items.value.filter((c) => c.id !== id);
      if (selected.value?.id === id) selected.value = null;
      if (selectedCourseId.value === id) selectedCourseId.value = null;
    } finally {
      loadingDetail.value = false;
    }
  }

  async function fetchEnrollments(courseId?: string | null, search?: string) {
    const id = courseId || selectedCourseId.value;
    if (!id) return;
    loadingEnrollments.value = true;
    try {
      const params: PaginationParams = {};
      if (search) params.search = search;
      const { data } = await coursesService.getEnrollments(id, params);
      enrollments.value = data.items;
    } finally {
      loadingEnrollments.value = false;
    }
  }

  return {
    items,
    selected,
    selectedCourse,
    selectedCourseId,
    enrollments,
    loadingList,
    loadingDetail,
    loadingEnrollments,
    listError,
    fetchCourses,
    setSelectedCourse,
    fetchCourseDetail,
    createCourse,
    updateCourse,
    deleteCourse,
    fetchEnrollments,
  };
});
