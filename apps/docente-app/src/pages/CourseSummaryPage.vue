<template>
  <q-page class="app-bottom-safe">
    <div class="app-shell app-stack">
      <section class="app-page-head">
        <div>
          <h1 class="app-page-title">Resumen del curso</h1>
          <p class="app-page-subtitle">{{ summary?.course ? `${summary.course.name} · Paralelo ${summary.course.parallel}` : 'Cargando resumen...' }}</p>
        </div>
      </section>

      <q-card v-if="loading" class="app-surface">
        <q-card-section class="app-empty">
          <q-spinner color="primary" size="28px" />
          <div class="q-mt-sm">Cargando resumen...</div>
        </q-card-section>
      </q-card>

      <template v-else-if="summary">
        <q-card class="app-surface">
          <q-card-section>
            <div class="app-page-head q-mb-sm">
              <div>
                <h2 class="app-page-title" style="font-size:1.05rem;">Clases del curso</h2>
                <p class="app-page-subtitle">{{ summary.sessions.length }} bloques con asistencia y actividades</p>
              </div>
            </div>

            <div class="summary-session-strip">
              <div v-for="session in summary.sessions" :key="session.id" class="summary-session-pill">
                <div class="summary-session-pill__date">{{ formatShortDate(session.sessionDate) }}</div>
                <div class="summary-session-pill__meta">
                  <span>P{{ session.partialNumber }}</span>
                  <span>{{ formatTime(session.startsAt) }}</span>
                </div>
                <div class="summary-session-pill__count">
                  {{ session.activities.length }} {{ session.activities.length === 1 ? 'actividad' : 'actividades' }}
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <div class="app-stack">
          <q-card v-for="student in summary.students" :key="student.enrollmentId" class="app-surface">
            <q-card-section>
              <div class="summary-student-head">
                <div>
                  <div class="text-weight-bold">{{ student.fullName }}</div>
                  <div class="text-caption text-grey-7">{{ student.studentCode }}</div>
                </div>
                <div class="summary-student-totals">
                  <div class="summary-total summary-total--present">{{ student.totals.present }} P</div>
                  <div class="summary-total summary-total--absent">{{ student.totals.absent }} A</div>
                  <div class="summary-total summary-total--justified">{{ student.totals.justified }} J</div>
                </div>
              </div>

              <div class="summary-student-sessions">
                <div
                  v-for="session in summary.sessions"
                  :key="session.id"
                  class="summary-session-card"
                >
                  <div class="summary-session-card__head">
                    <div class="summary-session-card__date">{{ formatShortDate(session.sessionDate) }}</div>
                    <div class="summary-attendance" :class="attendanceClass(findStudentSession(student, session.id)?.attendance)">
                      {{ attendanceLabel(findStudentSession(student, session.id)?.attendance) }}
                    </div>
                  </div>

                  <div v-if="session.activities.length === 0" class="text-caption text-grey-6">
                    Sin actividades
                  </div>

                  <div v-else class="summary-activity-list">
                    <div
                      v-for="activity in session.activities"
                      :key="activity.id"
                      class="summary-activity-row"
                    >
                      <span class="summary-activity-row__title">{{ activity.title }}</span>
                      <span class="summary-activity-row__value">
                        {{ formatActivityValue(findActivityValue(student, session.id, activity.id), activity.gradingMode) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
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
import { formatSessionDate, formatSessionTime } from 'src/utils/session-datetime';

const route = useRoute();
const $q = useQuasar();
const loading = ref(true);
const summary = ref<CourseMobileSummary | null>(null);

function formatShortDate(date: string) {
  return formatSessionDate(date, 'es-BO', { day: '2-digit', month: 'short' });
}

function formatTime(date: string) {
  return formatSessionTime(date);
}

function findStudentSession(student: CourseMobileSummaryStudent, sessionId: string) {
  return student.sessions.find((item) => item.sessionId === sessionId);
}

function findActivityValue(student: CourseMobileSummaryStudent, sessionId: string, activityId: string) {
  return findStudentSession(student, sessionId)?.activities.find((item) => item.activityId === activityId)?.value ?? null;
}

function attendanceLabel(value?: string) {
  return {
    P: 'Presente',
    A: 'Falta',
    J: 'Just.',
  }[value || ''] || 'Pend.';
}

function attendanceClass(value?: string) {
  return {
    P: 'summary-attendance--present',
    A: 'summary-attendance--absent',
    J: 'summary-attendance--justified',
  }[value || ''] || 'summary-attendance--pending';
}

function formatActivityValue(value: number | null, gradingMode: ActivityGradingMode) {
  if (value === null) return '--';
  return gradingMode === 'SIGNATURES' ? `${value}f` : `${Number(value).toFixed(0)}`;
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
.summary-session-strip {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.summary-session-pill {
  min-width: 112px;
  padding: 12px;
  border-radius: 18px;
  background: linear-gradient(180deg, #fff8e8, #f8f2e7);
  border: 1px solid rgba(217, 119, 6, 0.14);
}

.summary-session-pill__date {
  font-weight: 800;
  color: #1f3c5a;
}

.summary-session-pill__meta,
.summary-session-pill__count {
  margin-top: 4px;
  font-size: 0.75rem;
  color: #6b7280;
}

.summary-session-pill__meta {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.summary-student-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.summary-student-totals {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.summary-total {
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
}

.summary-total--present {
  background: #e7f8ee;
  color: #15803d;
}

.summary-total--absent {
  background: #feecec;
  color: #dc2626;
}

.summary-total--justified {
  background: #e8f2ff;
  color: #2563eb;
}

.summary-student-sessions {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  margin-top: 14px;
  padding-bottom: 4px;
}

.summary-session-card {
  min-width: 188px;
  max-width: 188px;
  padding: 12px;
  border-radius: 18px;
  background: #fbfbfa;
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.summary-session-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}

.summary-session-card__date {
  font-size: 0.82rem;
  font-weight: 800;
  color: #1f3c5a;
}

.summary-attendance {
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 700;
}

.summary-attendance--present {
  background: #e7f8ee;
  color: #15803d;
}

.summary-attendance--absent {
  background: #feecec;
  color: #dc2626;
}

.summary-attendance--justified {
  background: #e8f2ff;
  color: #2563eb;
}

.summary-attendance--pending {
  background: #f1f5f9;
  color: #64748b;
}

.summary-activity-list {
  display: grid;
  gap: 6px;
}

.summary-activity-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 0.77rem;
}

.summary-activity-row__title {
  color: #475569;
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.summary-activity-row__value {
  font-weight: 800;
  color: #0f172a;
  white-space: nowrap;
}
</style>
