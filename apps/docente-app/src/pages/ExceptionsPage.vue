<template>
  <q-page class="app-bottom-safe">
    <div class="app-shell app-stack">
      <section class="app-page-head">
        <div>
          <h1 class="app-page-title">Excepciones</h1>
          <p class="app-page-subtitle">Casos pendientes de resolución</p>
        </div>
        <div class="app-chip app-chip--warning">{{ pendingCount }} pendientes</div>
      </section>

      <q-btn-toggle
        v-model="selectedTab"
        :options="tabs"
        spread
        no-caps
        unelevated
        rounded
        class="q-mb-sm"
      />

      <q-card v-if="reportsStore.loadingExceptions" class="app-surface">
        <q-card-section class="app-empty">
          <q-spinner color="primary" size="28px" />
          <div class="q-mt-sm">Cargando excepciones...</div>
        </q-card-section>
      </q-card>

      <q-card v-else-if="loadError" class="app-surface">
        <q-card-section class="app-empty">
          <div class="app-empty__icon"><q-icon name="cloud_off" size="26px" /></div>
          <div>{{ loadError }}</div>
          <q-btn class="q-mt-md" flat color="primary" label="Reintentar" @click="loadExceptions" />
        </q-card-section>
      </q-card>

      <div v-else class="app-list">
        <q-card v-for="item in filteredItems" :key="item.id" class="app-list-card">
          <div class="app-list-card__row">
            <div>
              <h2 class="app-list-card__title">{{ typeLabel(item.type) }}</h2>
              <p class="app-list-card__meta">
                {{ studentLabel(item) }} · {{ courseLabel }}
              </p>
            </div>
            <div class="app-chip" :class="priorityClass(item.status)">
              {{ statusLabel(item.status) }}
            </div>
          </div>

          <p class="exception-note">{{ item.reason }}</p>

          <div class="exception-actions" v-if="item.status === 'PENDING'">
            <q-btn
              flat
              color="negative"
              label="Rechazar"
              :loading="exceptionsStore.resolvingId === item.id"
              @click="resolve(item.id, 'REJECTED')"
            />
            <q-btn
              flat
              color="positive"
              label="Aprobar"
              :loading="exceptionsStore.resolvingId === item.id"
              @click="resolve(item.id, 'APPROVED')"
            />
          </div>
        </q-card>

        <q-card v-if="filteredItems.length === 0" class="app-surface">
          <q-card-section class="app-empty">
            <div class="app-empty__icon"><q-icon name="task_alt" size="26px" /></div>
            <div>No hay excepciones en este estado.</div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import type { ExceptionListItem } from 'src/services/types';
import { useCoursesStore } from 'stores/courses';
import { useExceptionsStore } from 'stores/exceptions';
import { useReportsStore } from 'stores/reports';

const $q = useQuasar();
const coursesStore = useCoursesStore();
const reportsStore = useReportsStore();
const exceptionsStore = useExceptionsStore();

const tabs = [
  { label: 'Pendientes', value: 'PENDING' },
  { label: 'Aprobadas', value: 'APPROVED' },
  { label: 'Rechazadas', value: 'REJECTED' },
];
const selectedTab = ref<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');

const filteredItems = computed(() =>
  reportsStore.courseExceptions.filter((item) => item.status === selectedTab.value),
);
const pendingCount = computed(
  () => reportsStore.courseExceptions.filter((item) => item.status === 'PENDING').length,
);
const loadError = ref<string | null>(null);
const courseLabel = computed(() => coursesStore.selectedCourse?.subject?.name || 'Curso activo');

function studentLabel(item: ExceptionListItem) {
  const student = item.enrollment?.student;
  return student ? `${student.firstName} ${student.lastName}` : 'Estudiante no cargado';
}

function typeLabel(type: string) {
  return type.replaceAll('_', ' ');
}

function statusLabel(status: string) {
  return {
    PENDING: 'Pendiente',
    APPROVED: 'Aprobada',
    REJECTED: 'Rechazada',
    NEEDS_INFORMATION: 'Info',
    CANCELED: 'Cancelada',
  }[status] || status;
}

function priorityClass(status: string) {
  return status === 'PENDING' ? 'app-chip--warning' : status === 'APPROVED' ? 'app-chip--positive' : 'app-chip--danger';
}

async function resolve(exceptionId: string, status: 'APPROVED' | 'REJECTED') {
  if (!coursesStore.selectedCourseId) return;
  await exceptionsStore.resolveException(coursesStore.selectedCourseId, exceptionId, status);
  reportsStore.updateException(exceptionId, status);
  $q.notify({
    type: status === 'APPROVED' ? 'positive' : 'warning',
    message: status === 'APPROVED' ? 'Excepción aprobada.' : 'Excepción rechazada.',
  });
}

async function loadExceptions() {
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
      reportsStore.fetchCourseExceptions(courseId),
    ]);
  } catch {
    loadError.value = 'Error al cargar excepciones.';
  }
}

onMounted(() => {
  void loadExceptions();
});
</script>

<style scoped>
.exception-note {
  margin: 12px 0 0;
  color: #526173;
  line-height: 1.4;
}

.exception-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 14px;
}
</style>
