<template>
  <q-page class="app-bottom-safe">
    <div class="app-shell app-stack">
      <section class="app-page-head">
        <div>
          <h1 class="app-page-title">Resumen del curso</h1>
          <p class="app-page-subtitle">
            {{ summary?.course ? `${summary.course.name} · Paralelo ${summary.course.parallel}` : 'Cargando resumen...' }}
          </p>
        </div>
      </section>

      <q-card v-if="loading" class="app-surface">
        <q-card-section class="app-empty">
          <q-spinner color="primary" size="28px" />
          <div class="q-mt-sm">Cargando resumen...</div>
        </q-card-section>
      </q-card>

      <q-card v-else-if="!summary || summary.sessions.length === 0" class="app-surface">
        <q-card-section class="app-empty">
          <div class="app-empty__icon"><q-icon name="table_chart" size="28px" /></div>
          <div>No hay clases terminadas para resumir todavía.</div>
        </q-card-section>
      </q-card>

      <template v-else>
        <q-card class="app-surface">
          <q-card-section>
            <div class="app-page-head q-mb-sm">
              <div>
                <h2 class="app-page-title" style="font-size:1.05rem;">Tabla de seguimiento</h2>
                <p class="app-page-subtitle">{{ summary.students.length }} estudiantes · {{ summary.sessions.length }} clases terminadas</p>
              </div>
            </div>

            <div class="course-summary-table">
              <table class="course-summary-table__grid">
                <thead>
                  <tr>
                    <th class="course-summary-table__total-header">Resumen</th>
                    <th class="course-summary-table__student-header">Estudiante</th>
                    <th
                      v-for="session in summary.sessions"
                      :key="session.id"
                      class="course-summary-table__session-header"
                    >
                      <div class="course-summary-table__session-date">{{ formatShortDate(session.sessionDate) }}</div>
                      <div class="course-summary-table__session-meta">P{{ session.partialNumber }}</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="student in summary.students" :key="student.enrollmentId">
                    <td class="course-summary-table__total-cell">
                      <div class="course-summary-table__total course-summary-table__total--present">{{ student.totals.present }} P</div>
                      <div class="course-summary-table__total course-summary-table__total--absent">{{ student.totals.absent }} A</div>
                      <div class="course-summary-table__total course-summary-table__total--justified">{{ student.totals.justified }} J</div>
                    </td>
                    <td class="course-summary-table__student-cell">
                      <div
                        v-for="(part, index) in nameParts(student.fullName)"
                        :key="`${student.enrollmentId}-name-${index}`"
                        class="course-summary-table__student-name"
                      >
                        {{ part }}
                      </div>
                    </td>

                    <td
                      v-for="session in summary.sessions"
                      :key="`${student.enrollmentId}-${session.id}`"
                      class="course-summary-table__session-cell"
                    >
                      <div
                        class="course-summary-table__attendance"
                        :class="attendanceClass(findStudentSession(student, session.id)?.attendance)"
                      >
                        {{ attendanceLabel(findStudentSession(student, session.id)?.attendance) }}
                      </div>
                      <div v-if="session.activities.length > 0" class="course-summary-table__activities">
                        <div
                          v-for="activity in session.activities"
                          :key="activity.id"
                          class="course-summary-table__activity"
                        >
                          <span class="course-summary-table__activity-title">{{ shortActivityTitle(activity.title) }}</span>
                          <span class="course-summary-table__activity-value">
                            {{ formatActivityValue(findActivityValue(student, session.id, activity.id), activity.gradingMode) }}
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </q-card-section>
        </q-card>
      </template>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import type { ActivityGradingMode, CourseMobileSummary, CourseMobileSummaryStudent } from 'src/services/types';
import { reportsService } from 'src/services/reports.service';
import { formatSessionDate } from 'src/utils/session-datetime';

const route = useRoute();
const $q = useQuasar();
const loading = ref(true);
const summary = ref<CourseMobileSummary | null>(null);

function formatShortDate(date: string) {
  return formatSessionDate(date, 'es-BO', { day: '2-digit', month: 'short' });
}

function nameParts(fullName: string) {
  return fullName.split(/\s+/).filter(Boolean);
}

function findStudentSession(student: CourseMobileSummaryStudent, sessionId: string) {
  return student.sessions.find((item) => item.sessionId === sessionId);
}

function findActivityValue(student: CourseMobileSummaryStudent, sessionId: string, activityId: string) {
  return findStudentSession(student, sessionId)?.activities.find((item) => item.activityId === activityId)?.value ?? null;
}

function attendanceLabel(value?: string) {
  return {
    P: 'P',
    A: 'A',
    J: 'J',
  }[value || ''] || '--';
}

function attendanceClass(value?: string) {
  return {
    P: 'course-summary-table__attendance--present',
    A: 'course-summary-table__attendance--absent',
    J: 'course-summary-table__attendance--justified',
  }[value || ''] || 'course-summary-table__attendance--pending';
}

function formatActivityValue(value: number | null, gradingMode: ActivityGradingMode) {
  if (value === null) return '--';
  return gradingMode === 'SIGNATURES' ? `${value}f` : `${Number(value).toFixed(0)}`;
}

function shortActivityTitle(title: string) {
  return title.length > 10 ? `${title.slice(0, 10)}…` : title;
}

async function load() {
  loading.value = true;
  try {
    const { data } = await reportsService.getMobileSummary(String(route.params.id || ''));
    summary.value = data;
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: error?.response?.data?.message || 'No se pudo cargar el resumen del curso.',
    });
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  void load();
});
</script>

<style scoped>
.course-summary-table {
  overflow: auto;
  max-height: 60vh;
  max-height: 60dvh;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 18px;
}

.course-summary-table__grid {
  width: max-content;
  min-width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background: #fff;
}

.course-summary-table__grid th,
.course-summary-table__grid td {
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  border-right: 1px solid rgba(15, 23, 42, 0.05);
  vertical-align: top;
  background: #fff;
}

.course-summary-table__grid th {
  position: sticky;
  top: 0;
  z-index: 3;
  background: #f8fafc;
}

.course-summary-table__total-header,
.course-summary-table__total-cell {
  position: sticky;
  left: 0;
  background: #f5f8ff;
}

.course-summary-table__student-header,
.course-summary-table__student-cell {
  position: sticky;
  left: 64px;
  background: #fffdf8;
}

.course-summary-table__total-header,
.course-summary-table__student-header {
  z-index: 5;
}

.course-summary-table__total-cell,
.course-summary-table__student-cell {
  z-index: 4;
}

.course-summary-table__total-header,
.course-summary-table__total-cell {
  min-width: 64px;
  max-width: 64px;
}

.course-summary-table__student-header,
.course-summary-table__student-cell {
  min-width: 96px;
  max-width: 148px;
}

.course-summary-table__student-header,
.course-summary-table__session-header,
.course-summary-table__total-header {
  padding: 10px 8px;
  font-size: 0.76rem;
  font-weight: 800;
  color: #526173;
}

.course-summary-table__total-header {
  padding: 10px 4px;
  font-size: 0.64rem;
  text-align: center;
}

.course-summary-table__session-header {
  min-width: 110px;
  max-width: 110px;
  text-align: center;
}

.course-summary-table__session-date {
  font-weight: 800;
  color: #16324f;
}

.course-summary-table__session-meta {
  margin-top: 2px;
  font-size: 0.68rem;
  color: #7b8794;
}

.course-summary-table__student-cell {
  padding: 10px 10px 12px;
}

.course-summary-table__student-name {
  white-space: nowrap;
  font-size: 0.78rem;
  font-weight: 800;
  line-height: 1.3;
  color: #16324f;
}

.course-summary-table__session-cell {
  min-width: 110px;
  max-width: 110px;
  padding: 8px 6px 10px;
}

.course-summary-table__attendance {
  width: fit-content;
  margin: 0 auto 8px;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 800;
}

.course-summary-table__attendance--present {
  background: #e7f8ee;
  color: #15803d;
}

.course-summary-table__attendance--absent {
  background: #feecec;
  color: #dc2626;
}

.course-summary-table__attendance--justified {
  background: #e8f2ff;
  color: #2563eb;
}

.course-summary-table__attendance--pending {
  background: #f1f5f9;
  color: #64748b;
}

.course-summary-table__activities {
  display: grid;
  gap: 4px;
}

.course-summary-table__activity {
  display: grid;
  gap: 2px;
  padding: 5px 6px;
  border-radius: 10px;
  background: #faf7ef;
}

.course-summary-table__activity-title {
  font-size: 0.64rem;
  line-height: 1.1;
  color: #6b7280;
}

.course-summary-table__activity-value {
  font-size: 0.78rem;
  font-weight: 800;
  color: #111827;
}

.course-summary-table__total-cell {
  padding: 8px 4px;
}

.course-summary-table__total {
  margin-bottom: 4px;
  padding: 2px 4px;
  border-radius: 999px;
  text-align: center;
  font-size: 0.62rem;
  font-weight: 800;
}

.course-summary-table__total--present {
  background: #e7f8ee;
  color: #15803d;
}

.course-summary-table__total--absent {
  background: #feecec;
  color: #dc2626;
}

.course-summary-table__total--justified {
  background: #e8f2ff;
  color: #2563eb;
}
</style>
