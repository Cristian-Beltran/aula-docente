<template>
  <q-page class="app-bottom-safe">
    <div class="app-shell app-stack">
      <section class="app-page-head">
        <div>
          <h1 class="app-page-title">Reportes</h1>
          <p class="app-page-subtitle">Resumen y riesgo del curso</p>
        </div>
      </section>

      <q-card class="app-surface">
        <q-card-section class="q-gutter-md">
          <q-select
            v-model="selectedCourseIdModel"
            :options="courseOptions"
            emit-value
            map-options
            outlined
            dense
            label="Curso"
          />
        </q-card-section>
      </q-card>

      <div class="row q-col-gutter-sm">
        <div class="col-6">
          <q-card class="text-center q-pa-md rounded-borders">
            <div class="text-caption text-grey-7">Inscritos</div>
            <div class="text-h4 text-weight-bold text-primary q-mt-xs">{{ reportsStore.summary?.students ?? 0 }}</div>
          </q-card>
        </div>
        <div class="col-6">
          <q-card class="text-center q-pa-md rounded-borders">
            <div class="text-caption text-grey-7">Sesiones</div>
            <div class="text-h4 text-weight-bold text-primary q-mt-xs">{{ reportsStore.summary?.sessions ?? 0 }}</div>
          </q-card>
        </div>
        <div class="col-6">
          <q-card class="text-center q-pa-md rounded-borders">
            <div class="text-caption text-grey-7">Firmas</div>
            <div class="text-h4 text-weight-bold text-primary q-mt-xs">{{ reportsStore.summary?.signatures ?? 0 }}</div>
          </q-card>
        </div>
        <div class="col-6">
          <q-card class="text-center q-pa-md rounded-borders">
            <div class="text-caption text-grey-7">Pendientes</div>
            <div class="text-h4 text-weight-bold text-primary q-mt-xs">{{ reportsStore.summary?.pendingExceptions ?? 0 }}</div>
          </q-card>
        </div>
      </div>

      <q-card class="app-surface">
        <q-card-section>
          <div class="app-page-head q-mb-sm">
            <div>
              <h2 class="app-page-title" style="font-size: 1.05rem;">Comparación por grupos</h2>
              <p class="app-page-subtitle">Por grupo</p>
            </div>
          </div>
          <div v-if="reportsStore.loadingComparison" class="app-empty q-py-md">
            <q-spinner color="primary" size="20px" />
          </div>
          <div v-else-if="reportsStore.groupComparison.length === 0" class="app-empty q-py-md">
            No hay grupos en este curso.
          </div>
          <div v-else>
            <q-list separator>
              <q-item v-for="group in reportsStore.groupComparison" :key="group.id">
                <q-item-section>
                  <q-item-label>{{ group.name }}</q-item-label>
                  <q-item-label caption>{{ group.code }}</q-item-label>
                </q-item-section>
                <q-item-section side top>
                  <div class="text-caption text-grey-7 q-mb-xs">{{ group.activeMembers }} estudiantes</div>
                  <div class="text-caption text-grey-7">{{ group.sessions }} sesiones</div>
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </q-card-section>
      </q-card>

      <q-card class="app-surface">
        <q-card-section>
          <div class="app-page-head q-mb-sm">
            <div>
              <h2 class="app-page-title" style="font-size: 1.05rem;">Estudiantes en riesgo</h2>
              <p class="app-page-subtitle">Ordenados por ausencias y retrasos.</p>
            </div>
          </div>
          <div v-if="reportsStore.loadingComparison" class="app-empty q-py-md">
            <q-spinner color="primary" size="20px" />
          </div>
          <div v-else-if="reportsStore.riskStudents.length === 0" class="app-empty q-py-md">
            No hay estudiantes en riesgo.
          </div>
          <div v-else>
            <q-list separator>
              <q-item v-for="student in reportsStore.riskStudents.slice(0, 5)" :key="student.enrollmentId">
                <q-item-section>
                  <q-item-label>{{ student.firstName }} {{ student.lastName }}</q-item-label>
                  <q-item-label caption>{{ student.studentCode }}</q-item-label>
                </q-item-section>
                <q-item-section side top>
                  <div class="text-caption text-grey-7 q-mb-xs">{{ student.absences }} faltas</div>
                  <div class="text-caption text-grey-7">{{ student.lates }} retrasos</div>
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useCoursesStore } from 'stores/courses';
import { useReportsStore } from 'stores/reports';

const coursesStore = useCoursesStore();
const reportsStore = useReportsStore();

const courseOptions = computed(() =>
  coursesStore.items.map((course) => ({
    label: `${course.subject?.name || 'Curso'} · Paralelo ${course.parallel}`,
    value: course.id,
  })),
);

const selectedCourseIdModel = computed({
  get: () => coursesStore.selectedCourseId,
  set: (value: string | null) => {
    if (value) {
      coursesStore.setSelectedCourse(value);
      void loadReports(value);
    }
  },
});

async function loadReports(courseId?: string) {
  const targetCourseId = courseId || coursesStore.selectedCourseId || coursesStore.items[0]?.id;
  if (!targetCourseId) return;

  coursesStore.setSelectedCourse(targetCourseId);
  await Promise.all([
    coursesStore.fetchCourseDetail(targetCourseId),
    reportsStore.hydrateCourseDashboard(targetCourseId),
  ]);
}

onMounted(async () => {
  if (coursesStore.items.length === 0) {
    await coursesStore.fetchCourses();
  }
  await loadReports();
});
</script>
