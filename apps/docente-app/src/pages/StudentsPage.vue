<template>
  <q-page class="app-bottom-safe">
    <div class="app-shell app-stack">
      <section class="app-page-head">
        <div>
          <h1 class="app-page-title">Estudiantes</h1>
          <p class="app-page-subtitle">Inscritos en el curso activo</p>
        </div>
      </section>

      <q-input
        v-model="search"
        outlined
        dense
        class="app-search"
        label="Buscar por nombre o código"
      >
        <template #prepend>
          <q-icon name="search" />
        </template>
      </q-input>

      <q-card class="app-surface">
        <q-card-section v-if="loadError" class="app-empty">
          <div class="app-empty__icon"><q-icon name="cloud_off" size="26px" /></div>
          <div>{{ loadError }}</div>
          <q-btn class="q-mt-md" flat color="primary" label="Reintentar" @click="loadEnrollments" />
        </q-card-section>

        <q-card-section v-if="!loadError" class="row items-center justify-between q-pb-sm">
            <div>
              <div class="app-list-card__title">Lista oficial</div>
              <div class="app-list-card__meta">{{ subtitle }}</div>
            </div>
            <div class="app-chip">{{ parallel }}</div>
          </q-card-section>

          <q-list v-if="!coursesStore.loadingEnrollments && coursesStore.enrollments.length > 0" separator>
          <q-item v-for="enrollment in coursesStore.enrollments" :key="enrollment.id" class="q-px-none">
            <q-item-section avatar>
              <q-avatar size="42px" color="primary" text-color="white" style="border-radius: 14px" class="text-weight-bolder" :style="{ fontSize: '0.82rem' }">
                {{ initials(enrollment.student.firstName, enrollment.student.lastName) }}
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ enrollment.student.firstName }} {{ enrollment.student.lastName }}</q-item-label>
              <q-item-label caption>{{ enrollment.student.studentCode }} · {{ enrollment.status }}</q-item-label>
            </q-item-section>
            <q-item-section side top>
              <div class="column items-end q-gutter-xs">
                <div class="app-chip" :class="enrollment.status === 'ACTIVE' ? 'app-chip--positive' : 'app-chip--warning'">
                  {{ enrollment.status === 'ACTIVE' ? 'Activo' : enrollment.status }}
                </div>
              </div>
            </q-item-section>
          </q-item>
        </q-list>

        <q-card-section v-else-if="!coursesStore.loadingEnrollments && coursesStore.enrollments.length === 0" class="app-empty">
          <div class="app-empty__icon"><q-icon name="person_off" size="26px" /></div>
          <div>No hay estudiantes inscritos en este curso.</div>
        </q-card-section>

        <q-card-section v-else class="app-empty">
          <q-spinner color="primary" size="28px" />
          <div class="q-mt-sm">Cargando estudiantes...</div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useCoursesStore } from 'stores/courses';

const coursesStore = useCoursesStore();
const search = ref('');
const loadError = ref<string | null>(null);

const subtitle = computed(
  () => `${coursesStore.enrollments.length} inscritos · ${coursesStore.selectedCourse?.subject?.name || 'Sin curso'}`,
);
const parallel = computed(() => `Paralelo ${coursesStore.selectedCourse?.parallel || '-'}`);

function initials(firstName: string, lastName: string) {
  return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
}

async function loadEnrollments() {
  loadError.value = null;
  if (!coursesStore.selectedCourseId) {
    await coursesStore.fetchCourses();
  }
  const courseId = coursesStore.selectedCourseId || coursesStore.items[0]?.id;
  if (!courseId) return;
  coursesStore.setSelectedCourse(courseId);
  try {
    await Promise.all([
      coursesStore.fetchCourseDetail(courseId),
      coursesStore.fetchEnrollments(courseId, search.value),
    ]);
  } catch {
    loadError.value = 'Error al cargar estudiantes.';
  }
}

let searchDebounce: ReturnType<typeof setTimeout> | null = null;
watch(search, () => {
  if (searchDebounce) clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    void coursesStore.fetchEnrollments(coursesStore.selectedCourseId || undefined, search.value);
  }, 250);
});

onMounted(() => {
  void loadEnrollments();
});
</script>
