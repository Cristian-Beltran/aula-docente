<template>
  <q-page class="app-bottom-safe">
    <div class="app-shell app-stack">
      <section class="app-page-head">
        <div>
          <h1 class="app-page-title">Clase actual</h1>
          <p class="app-page-subtitle">
            {{ session ? sessionLabel(session) : 'No hay clase en progreso' }}
          </p>
        </div>
        <div class="app-chip" :class="session ? 'app-chip--positive' : ''">
          {{ session ? 'En progreso' : 'Sin abrir' }}
        </div>
      </section>

      <q-card v-if="loading" class="app-surface">
        <q-card-section class="app-empty">
          <q-spinner color="primary" size="28px" />
          <div class="q-mt-sm">Cargando clase...</div>
        </q-card-section>
      </q-card>

      <q-card v-else-if="!session" class="app-surface">
        <q-card-section class="app-empty">
          <div class="app-empty__icon"><q-icon name="play_circle" size="26px" /></div>
          <div>{{ nextSession ? 'No hay clase en progreso. Tu próxima clase ya está identificada.' : 'Abre una clase desde Hoy para continuar con lista, actividades y QR.' }}</div>
        </q-card-section>
        <q-separator v-if="nextSession" />
        <q-card-section v-if="nextSession">
          <div class="text-caption text-uppercase text-primary text-weight-bold">Próxima clase</div>
          <div class="q-mt-sm text-weight-bold">{{ sessionLabel(nextSession) }}</div>
          <div class="text-caption text-grey-7 q-mt-xs">{{ timeRange(nextSession, true) }}</div>
          <q-btn
            class="q-mt-md"
            flat
            color="primary"
            label="Ver clase"
            :to="{ name: 'session-detail', params: { sessionId: nextSession.id } }"
          />
        </q-card-section>
      </q-card>

      <template v-else>
        <div class="app-grid app-grid--sidebar current-class-overview">
          <div class="app-grid current-class-overview__main">
            <q-card class="app-list-card">
              <div class="app-list-card__row">
                <div>
                  <h2 class="app-list-card__title">{{ session.topicTaught || sessionLabel(session) }}</h2>
                  <p class="app-list-card__meta">
                    {{ timeRange(session) }}
                    <span v-if="session.classGroup">· {{ session.classGroup.name }}</span>
                    <span class="q-ml-sm app-chip" :class="partialClass(session.partialNumber)">P{{ session.partialNumber || 1 }}</span>
                  </p>
                </div>
                <q-btn
                  flat
                  color="primary"
                  icon="fact_check"
                  label="Tomar lista"
                  :to="{ name: 'session-attendance', params: { sessionId: session.id } }"
                />
              </div>
            </q-card>

            <q-card class="app-surface">
              <q-card-section>
                <div class="row q-col-gutter-sm">
                  <div class="col-12 col-sm-4">
                    <q-btn
                      color="primary"
                      unelevated
                      class="full-width"
                      label="Tomar lista"
                      :to="{ name: 'session-attendance', params: { sessionId: session.id } }"
                    />
                  </div>
                  <div class="col-12 col-sm-4">
                    <q-btn
                      color="accent"
                      unelevated
                      class="full-width"
                      label="Abrir escáner QR"
                      :disable="!activeActivity"
                      :to="{ name: 'scan' }"
                    />
                  </div>
                  <div class="col-12 col-sm-4">
                    <q-btn color="secondary" unelevated class="full-width" label="Nueva actividad" @click="promptCreateActivity" />
                  </div>
                </div>
              </q-card-section>
            </q-card>

            <div class="app-kpi-grid">
              <q-card class="app-kpi-card text-center">
                <div class="text-caption text-grey-7">Asistencia</div>
                <div class="text-h4 text-weight-bold text-primary q-mt-xs">
                  {{ attendanceStats.registered }}/{{ rosterItems.length }}
                </div>
                <div class="text-caption q-mt-xs" :class="session.attendanceTaken ? 'text-positive' : 'text-orange-8'">
                  {{ session.attendanceTaken ? 'Lista ya tomada' : 'Lista pendiente' }}
                </div>
              </q-card>
              <q-card class="app-kpi-card text-center">
                <div class="text-caption text-grey-7">Actividades</div>
                <div class="text-h4 text-weight-bold text-primary q-mt-xs">{{ activities.length }}</div>
              </q-card>
            </div>
          </div>

          <q-card class="app-surface current-class-log">
            <q-card-section>
              <div class="app-page-head q-mb-sm">
                <div>
                  <h2 class="app-page-title" style="font-size:1.05rem;">Bitácora</h2>
                  <p class="app-page-subtitle">Tema visto y resumen breve de la clase</p>
                </div>
              </div>

              <div class="q-gutter-md">
                <q-input v-model="logForm.logTopic" outlined dense label="Tema pasado" />
                <q-input
                  v-model="logForm.logContent"
                  outlined
                  type="textarea"
                  autogrow
                  label="Contenido resumido"
                />
                <q-btn
                  color="primary"
                  unelevated
                  icon="save"
                  label="Guardar bitácora"
                  :loading="savingLog"
                  @click="saveSessionLog"
                />
              </div>
            </q-card-section>
          </q-card>
        </div>

        <q-card class="app-surface">
          <q-card-section>
            <div class="app-page-head q-mb-sm">
              <div>
                <h2 class="app-page-title" style="font-size:1.05rem;">Lista de asistencia</h2>
                <p class="app-page-subtitle">{{ rosterItems.length }} estudiantes esperados</p>
              </div>
            </div>

            <q-list separator>
              <q-item v-for="item in rosterItems" :key="item.enrollmentId">
                <q-item-section>
                  <q-item-label>{{ item.fullName }}</q-item-label>
                  <q-item-label caption>{{ item.studentCode }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <StatusChip :status="item.status || 'PENDING'" />
                </q-item-section>
              </q-item>
            </q-list>

            <div v-if="rosterItems.length === 0" class="app-empty q-py-md">
              <div class="text-caption text-grey-7">No hay estudiantes en esta sesión.</div>
            </div>
          </q-card-section>
        </q-card>

        <q-card class="app-surface">
          <q-card-section>
            <div class="app-page-head q-mb-sm">
              <div>
                <h2 class="app-page-title" style="font-size:1.05rem;">Actividades</h2>
                <p class="app-page-subtitle">Evaluaciones y firmas de esta clase</p>
              </div>
            </div>

            <q-list separator>
              <q-item v-for="activity in activities" :key="activity.id">
                <q-item-section>
                  <q-item-label>{{ activity.title }}</q-item-label>
                  <q-item-label caption>
                    {{ activity.gradingMode === 'SCORE_0_100' ? 'Nota 0-100' : 'Firmas' }}
                    <span v-if="activity.maxSignatures"> · Máx {{ activity.maxSignatures }}</span>
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <div class="row items-center q-gutter-sm no-wrap">
                    <q-btn flat round dense icon="edit" @click="promptEditActivity(activity)" />
                    <q-btn flat round dense color="negative" icon="delete" @click="confirmDeleteActivity(activity)" />
                    <StatusChip :status="activity.status === 'OPEN' ? 'ACTIVE' : activity.status" />
                  </div>
                </q-item-section>
              </q-item>
            </q-list>

            <div v-if="activities.length === 0" class="app-empty q-py-md">
              <div class="text-caption text-grey-7">Sin actividades registradas.</div>
            </div>
          </q-card-section>
        </q-card>

        <q-card class="app-surface">
          <q-card-section>
            <div class="app-page-head q-mb-sm">
              <div>
                <h2 class="app-page-title" style="font-size:1.05rem;">Resumen por estudiante</h2>
                <p class="app-page-subtitle">Asistencia y resultados de actividades en una sola vista</p>
              </div>
            </div>

            <div v-if="activityBoard.length > 0" class="session-board app-scroll-x">
              <table class="session-board__table">
                <thead>
                  <tr>
                    <th>Estudiante</th>
                    <th>Asistencia</th>
                    <th v-for="activity in activities" :key="activity.id">{{ activity.title }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in activityBoard" :key="row.enrollmentId">
                    <td>
                      <div class="text-weight-medium">{{ row.fullName }}</div>
                      <div class="text-caption text-grey-7">{{ row.studentCode }}</div>
                    </td>
                    <td>{{ formatAttendance(row.attendanceStatus) }}</td>
                    <td v-for="cell in row.activities" :key="cell.activityId">
                      {{ formatActivityValue(cell.gradingMode, cell.value) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-else class="app-empty q-py-md">
              <div class="text-caption text-grey-7">Todavía no hay actividades para resumir.</div>
            </div>
          </q-card-section>
        </q-card>

        <q-card class="app-surface">
          <q-card-section>
            <q-btn
              flat
              color="negative"
              class="full-width"
              label="Marcar clase completa"
              @click="completeCurrentSession"
            />
          </q-card-section>
        </q-card>
      </template>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import type {
  Activity,
  AttendanceStatus,
  ClassSession,
  WorkflowRosterItem,
  WorkflowSessionBoardRow,
} from 'src/services/types';
import StatusChip from 'components/StatusChip.vue';
import { teacherWorkflowService } from 'src/services/teacher-workflow.service';
import { useTeacherWorkflowStore } from 'stores/teacher-workflow';

const route = useRoute();
const router = useRouter();
const workflow = useTeacherWorkflowStore();
const $q = useQuasar();
const loading = ref(true);
const savingLog = ref(false);
const session = ref<ClassSession | null>(null);
const rosterItems = ref<WorkflowRosterItem[]>([]);
const activities = ref<Activity[]>([]);
const activityBoard = ref<WorkflowSessionBoardRow[]>([]);
const logForm = ref({ logTopic: '', logContent: '' });
const forcedSessionId = computed(() => String(route.query.sessionId || ''));
const nextSession = computed(() => workflow.weekAgenda?.nextSession || workflow.agenda?.nextSession || null);
const activeActivity = computed(() => activities.value.find((item) => item.status === 'OPEN') || null);
const attendanceStats = computed(() => ({
  registered: rosterItems.value.filter((item) => item.status && item.status !== 'PENDING').length,
}));

function sessionLabel(current: ClassSession) {
  return current.course?.displayName || current.course?.name || 'Clase actual';
}

function timeRange(current: ClassSession, withDate = false) {
  const start = new Date(current.startsAt).toLocaleString('es-BO', {
    ...(withDate ? { weekday: 'short', day: '2-digit', month: 'short' } : {}),
    hour: '2-digit',
    minute: '2-digit',
  });
  const end = current.endsAt
    ? new Date(current.endsAt).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })
    : '';
  return end ? `${start} - ${end}` : start;
}

function partialClass(n?: number) {
  return {
    1: 'app-chip--positive',
    2: 'app-chip--warning',
    3: 'app-chip--danger',
  }[n || 1] || '';
}

function syncWorkflowSession(current: ClassSession | null) {
  workflow.currentSession = current;
}

async function loadSessionDetail(sessionId: string) {
  const { data } = await teacherWorkflowService.getSessionDetail(sessionId);
  session.value = data.session;
  rosterItems.value = data.roster.items;
  activities.value = data.activities;
  activityBoard.value = data.activityBoard;
  workflow.roster = data.roster;
  workflow.activities = data.activities;
  syncWorkflowSession(data.session);
  logForm.value = {
    logTopic: data.session.logTopic || '',
    logContent: data.session.logContent || '',
  };
}

async function load() {
  loading.value = true;
  try {
    await workflow.fetchWeek();
    const requestedId = forcedSessionId.value;
    if (requestedId) {
      await loadSessionDetail(requestedId);
      return;
    }

    const current = await workflow.fetchCurrentSession();
    if (!current?.id) {
      session.value = null;
      rosterItems.value = [];
      activities.value = [];
      activityBoard.value = [];
      logForm.value = { logTopic: '', logContent: '' };
      return;
    }

    await loadSessionDetail(current.id);
  } catch (error: any) {
    session.value = null;
    $q.notify({
      type: 'negative',
      message: error?.response?.data?.message || 'No se pudo cargar la clase.',
    });
  } finally {
    loading.value = false;
  }
}

async function saveSessionLog() {
  if (!session.value) return;
  savingLog.value = true;
  try {
    const { data } = await teacherWorkflowService.updateSessionLog(session.value.id, logForm.value);
    session.value = { ...session.value, ...data };
    syncWorkflowSession(session.value);
    logForm.value = {
      logTopic: data.logTopic || '',
      logContent: data.logContent || '',
    };
    $q.notify({ type: 'positive', message: 'Bitácora guardada.' });
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: error?.response?.data?.message || 'No se pudo guardar la bitácora.',
    });
  } finally {
    savingLog.value = false;
  }
}

function formatAttendance(status: AttendanceStatus | null) {
  if (!status) return 'Pendiente';
  return {
    PRESENT: 'Asistió',
    LATE: 'Tarde',
    ABSENT: 'Faltó',
    JUSTIFIED: 'Justificada',
    EARLY_LEAVE: 'Salió antes',
  }[status] || status;
}

function formatActivityValue(gradingMode: string, value: number | null) {
  if (gradingMode === 'SIGNATURES') {
    return value ? `${value} firmas` : '0 firmas';
  }
  return value === null ? 'Sin nota' : value.toFixed(0);
}

function promptCreateActivity() {
  if (!session.value) return;
  void openActivityEditor('create');
}

async function openActivityEditor(mode: 'create' | 'edit', activity?: Activity) {
  if (!session.value) return;

  const title = await new Promise<string | null>((resolve) => {
    $q.dialog({
      title: mode === 'create' ? 'Nueva actividad' : 'Editar actividad',
      prompt: {
        model: activity?.title || '',
        type: 'text',
        label: 'Nombre visible',
      },
      cancel: true,
      ok: { label: 'Continuar' },
    })
      .onOk((value) => resolve(String(value || '').trim()))
      .onCancel(() => resolve(null));
  });
  if (!title) return;

  const gradingMode = await new Promise<'SIGNATURES' | 'SCORE_0_100' | null>((resolve) => {
    $q.dialog({
      title: 'Modo de actividad',
      options: {
        type: 'radio',
        model: activity?.gradingMode || 'SIGNATURES',
        items: [
          { label: 'Firmas acumulativas', value: 'SIGNATURES' },
          { label: 'Nota de 0 a 100', value: 'SCORE_0_100' },
        ],
      },
      cancel: true,
      ok: { label: 'Continuar' },
    })
      .onOk((value) => resolve(value))
      .onCancel(() => resolve(null));
  });
  if (!gradingMode) return;

  let maxSignatures = activity?.maxSignatures || 1;
  if (gradingMode === 'SIGNATURES') {
    const maxValue = await new Promise<number | null>((resolve) => {
      $q.dialog({
        title: 'Máximo de firmas',
        prompt: {
          model: String(activity?.maxSignatures || 1),
          type: 'number',
          label: 'Cantidad máxima',
        },
        cancel: true,
        ok: { label: mode === 'create' ? 'Crear' : 'Guardar' },
      })
        .onOk((value) => resolve(Math.max(1, Number(value || 1))))
        .onCancel(() => resolve(null));
    });
    if (maxValue === null) return;
    maxSignatures = maxValue;
  }

  try {
    if (mode === 'create') {
      await teacherWorkflowService.createActivity(session.value.id, { title, gradingMode, maxSignatures });
      $q.notify({ type: 'positive', message: 'Actividad creada.' });
    } else {
      await teacherWorkflowService.updateActivity(activity!.id, { title, gradingMode, maxSignatures });
      $q.notify({ type: 'positive', message: 'Actividad actualizada.' });
    }
    await loadSessionDetail(session.value.id);
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: error?.response?.data?.message || 'No se pudo guardar la actividad.',
    });
  }
}

function promptEditActivity(activity: Activity) {
  void openActivityEditor('edit', activity);
}

function confirmDeleteActivity(activity: Activity) {
  $q.dialog({
    title: 'Eliminar actividad',
    message: `Se eliminará "${activity.title}".`,
    cancel: true,
    ok: { label: 'Eliminar', color: 'negative' },
  }).onOk(async () => {
    try {
      await teacherWorkflowService.deleteActivity(activity.id);
      await loadSessionDetail(session.value!.id);
      $q.notify({ type: 'positive', message: 'Actividad eliminada.' });
    } catch (error: any) {
      $q.notify({
        type: 'negative',
        message: error?.response?.data?.message || 'No se pudo eliminar la actividad.',
      });
    }
  });
}

function completeCurrentSession() {
  if (!session.value) return;
  $q.dialog({
    title: 'Completar clase',
    message: 'Una clase completada ya no aceptará más asistencia ni registros QR.',
    cancel: true,
    ok: { label: 'Completar', color: 'negative' },
  }).onOk(async () => {
    await workflow.completeSession(session.value!.id, logForm.value);
    syncWorkflowSession(null);
    await workflow.fetchToday();
    await workflow.fetchWeek();
    if (forcedSessionId.value) {
      await router.replace({ name: 'current-class' });
    }
    session.value = null;
    rosterItems.value = [];
    activities.value = [];
    activityBoard.value = [];
    $q.notify({ type: 'positive', message: 'Clase completada.' });
  });
}

onMounted(() => {
  void load();
});
</script>

<style scoped>
.current-class-overview__main,
.current-class-log {
  align-self: start;
}

.session-board__table {
  width: 100%;
  min-width: 720px;
  border-collapse: collapse;
}

.session-board__table th,
.session-board__table td {
  padding: 10px 12px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  text-align: left;
  vertical-align: top;
}

.session-board__table th {
  font-size: 0.78rem;
  color: #5b6472;
  font-weight: 700;
  white-space: nowrap;
}

@media (min-width: 1024px) {
  .current-class-log {
    position: sticky;
    top: 88px;
  }
}
</style>
