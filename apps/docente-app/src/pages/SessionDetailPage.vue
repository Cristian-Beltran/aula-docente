<template>
  <q-page class="app-bottom-safe">
    <div class="app-shell app-stack" v-if="session">
      <section class="app-page-head">
        <div>
          <h1 class="app-page-title">{{ session.topicTaught || session.label || 'Clase' }}</h1>
          <p class="app-page-subtitle">{{ formatDate(session.startsAt) }} · {{ formatTime(session.startsAt) }} – {{ formatTime(session.endsAt) }}</p>
        </div>
        <div class="row items-center q-gutter-sm">
          <q-btn-dropdown
            :color="partialColor(session.partialNumber)"
            unelevated
            size="sm"
            :label="'P' + (session.partialNumber || 1)"
            :loading="changingPartial"
          >
            <q-list dense>
              <q-item clickable v-close-popup @click="changePartial(1)" :active="(session.partialNumber || 1) === 1">
                <q-item-section>Parcial 1</q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="changePartial(2)" :active="session.partialNumber === 2">
                <q-item-section>Parcial 2</q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="changePartial(3)" :active="session.partialNumber === 3">
                <q-item-section>Parcial 3</q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
          <StatusChip :status="session.status" />
        </div>
      </section>

      <q-card class="app-surface">
        <q-card-section>
          <div class="row q-col-gutter-sm">
            <div class="col-12 col-sm-4" v-if="session.status === 'PLANNED'">
              <q-btn color="primary" unelevated class="full-width" label="Tomar clase" :loading="opening" @click="startSession" />
            </div>
            <div class="col-12 col-sm-4" v-if="session.status === 'OPEN'">
              <q-btn
                color="primary"
                unelevated
                class="full-width"
                label="Tomar lista"
                :to="{ name: 'session-attendance', params: { sessionId: session.id } }"
              />
            </div>
            <div class="col-12 col-sm-4" v-if="session.status === 'OPEN'">
              <q-btn color="accent" unelevated class="full-width" label="Ir a clase actual" :to="{ name: 'current-class' }" />
            </div>
            <div class="col-12 col-sm-4" v-if="canManageActivities">
              <q-btn color="secondary" unelevated class="full-width" label="Nueva actividad" @click="promptCreateActivity" />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <q-card class="app-surface">
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
              placeholder="Ej: conceptos repasados, ejercicios, acuerdos o tareas"
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

      <div class="row q-col-gutter-sm">
        <div class="col-6">
          <q-card class="text-center q-pa-md rounded-borders">
            <div class="text-caption text-grey-7">Asistencia</div>
            <div class="text-h4 text-weight-bold text-primary q-mt-xs">{{ attendanceStats.registered }}/{{ rosterItems.length }}</div>
            <div class="text-caption q-mt-xs" :class="session.attendanceTaken ? 'text-positive' : 'text-orange-8'">
              {{ session.attendanceTaken ? 'Lista ya tomada' : 'Lista pendiente' }}
            </div>
          </q-card>
        </div>
        <div class="col-6">
          <q-card class="text-center q-pa-md rounded-borders">
            <div class="text-caption text-grey-7">Actividades</div>
            <div class="text-h4 text-weight-bold text-primary q-mt-xs">{{ activities.length }}</div>
          </q-card>
        </div>
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

          <div v-if="rosterItems.length === 0 && !loading" class="app-empty q-py-md">
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
            <q-item v-for="act in activities" :key="act.id">
              <q-item-section>
                <q-item-label>{{ act.title }}</q-item-label>
                <q-item-label caption>
                  {{ act.gradingMode === 'SCORE_0_100' ? 'Nota 0-100' : 'Firmas' }}
                  <span v-if="act.maxSignatures"> · Máx {{ act.maxSignatures }}</span>
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <div class="row items-center q-gutter-sm no-wrap">
                  <q-btn v-if="canManageActivities" flat round dense icon="edit" @click="promptEditActivity(act)" />
                  <q-btn v-if="canManageActivities" flat round dense color="negative" icon="delete" @click="confirmDeleteActivity(act)" />
                  <StatusChip :status="act.status === 'OPEN' ? 'ACTIVE' : act.status" />
                </div>
              </q-item-section>
            </q-item>
          </q-list>

          <div v-if="activities.length === 0 && !loading" class="app-empty q-py-md">
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

          <div v-if="activityBoard.length > 0" class="session-board">
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

      <q-card v-if="session.status !== 'COMPLETED' && session.status !== 'CLOSED'" class="app-surface">
        <q-card-section>
          <q-btn
            color="positive"
            unelevated
            icon="check_circle"
            label="Concluir clase"
            class="full-width"
            :loading="completing"
            @click="confirmComplete"
          />
        </q-card-section>
      </q-card>

      <q-card v-if="session.status === 'COMPLETED' || session.status === 'CLOSED'" class="app-surface">
        <q-card-section class="text-center">
          <q-icon name="task_alt" size="32px" color="positive" class="q-mb-sm" />
          <div class="text-weight-bold text-positive">Esta clase ya fue tomada</div>
          <div class="text-caption text-grey-7 q-mt-xs">No se puede modificar ni eliminar porque ya concluyó.</div>
        </q-card-section>
      </q-card>
    </div>

    <div v-else-if="loading" class="app-shell app-stack">
      <q-card class="app-surface">
        <q-card-section class="app-empty">
          <q-spinner color="primary" size="28px" />
          <div class="q-mt-sm">Cargando clase...</div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import type { Activity, AttendanceStatus, WorkflowRosterItem, WorkflowSessionBoardRow } from 'src/services/types';
import { teacherWorkflowService } from 'src/services/teacher-workflow.service';
import { useTeacherWorkflowStore } from 'stores/teacher-workflow';
import StatusChip from 'components/StatusChip.vue';

const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const workflow = useTeacherWorkflowStore();
const sessionId = ref(String(route.params.sessionId || ''));
const session = ref<any>(null);
const rosterItems = ref<WorkflowRosterItem[]>([]);
const activities = ref<Activity[]>([]);
const activityBoard = ref<WorkflowSessionBoardRow[]>([]);
const loading = ref(true);
const completing = ref(false);
const opening = ref(false);
const savingLog = ref(false);
const changingPartial = ref(false);
const logForm = ref({ logTopic: '', logContent: '' });
const canManageActivities = computed(() => ['PLANNED', 'OPEN'].includes(session.value?.status || ''));

const attendanceStats = computed(() => {
  const registered = rosterItems.value.filter((r) => r.status && r.status !== 'PENDING').length;
  return { registered };
});

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function formatTime(dateStr: string) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
}

function partialColor(n?: number) {
  return { 1: 'positive', 2: 'warning', 3: 'negative' }[n || 1];
}

async function changePartial(n: number) {
  if (!session.value) return;
  changingPartial.value = true;
  try {
    const { data } = await teacherWorkflowService.updateSessionPartial(sessionId.value, n);
    session.value = { ...session.value, ...data };
    $q.notify({ type: 'positive', message: `Asignado a parcial ${n}` });
  } catch (e: any) {
    $q.notify({ type: 'negative', message: e?.response?.data?.message || 'No se pudo cambiar el parcial.' });
  } finally {
    changingPartial.value = false;
  }
}

async function load() {
  loading.value = true;
  try {
    const { data } = await teacherWorkflowService.getSessionDetail(sessionId.value);
    session.value = data.session;
    rosterItems.value = data.roster.items;
    activities.value = data.activities;
    activityBoard.value = data.activityBoard;
    logForm.value = {
      logTopic: data.session.logTopic || '',
      logContent: data.session.logContent || '',
    };
  } catch {
    $q.notify({ type: 'negative', message: 'Error al cargar la clase.' });
  } finally {
    loading.value = false;
  }
}

async function saveSessionLog() {
  savingLog.value = true;
  try {
    const { data } = await teacherWorkflowService.updateSessionLog(sessionId.value, logForm.value);
    session.value = { ...session.value, ...data };
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

async function startSession() {
  opening.value = true;
  try {
    await workflow.openSession(sessionId.value);
    await router.push({ name: 'current-class', query: { sessionId: sessionId.value } });
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: error?.response?.data?.message || 'No se pudo iniciar la clase.',
    });
  } finally {
    opening.value = false;
  }
}

async function openActivityEditor(mode: 'create' | 'edit', activity?: Activity) {
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
      await teacherWorkflowService.createActivity(sessionId.value, { title, gradingMode, maxSignatures });
      $q.notify({ type: 'positive', message: 'Actividad creada.' });
    } else {
      await teacherWorkflowService.updateActivity(activity!.id, { title, gradingMode, maxSignatures });
      $q.notify({ type: 'positive', message: 'Actividad actualizada.' });
    }
    await load();
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: error?.response?.data?.message || 'No se pudo guardar la actividad.',
    });
  }
}

function promptCreateActivity() {
  void openActivityEditor('create');
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
      await load();
      $q.notify({ type: 'positive', message: 'Actividad eliminada.' });
    } catch (error: any) {
      $q.notify({
        type: 'negative',
        message: error?.response?.data?.message || 'No se pudo eliminar la actividad.',
      });
    }
  });
}

function confirmComplete() {
  $q.dialog({
    title: 'Concluir clase',
    message: 'La clase se marcará como tomada y ya no podrá editarse ni eliminarse.',
    cancel: true,
    ok: { label: 'Concluir', color: 'positive' },
  }).onOk(async () => {
    completing.value = true;
    try {
      const { data } = await teacherWorkflowService.completeSession(sessionId.value, logForm.value);
      session.value = { ...session.value, ...data, status: 'COMPLETED' };
      $q.notify({ type: 'positive', message: 'Clase concluida.' });
    } catch {
      $q.notify({ type: 'negative', message: 'Error al concluir la clase.' });
    } finally {
      completing.value = false;
    }
  });
}

onMounted(() => {
  void load();
});
</script>

<style scoped>
.session-board {
  overflow-x: auto;
}

.session-board__table {
  width: 100%;
  min-width: 520px;
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
</style>
