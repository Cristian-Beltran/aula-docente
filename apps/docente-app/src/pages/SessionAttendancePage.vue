<template>
  <q-page class="app-bottom-safe">
    <div class="app-shell app-stack">
      <section class="app-page-head">
        <div>
          <h1 class="app-page-title">Tomar lista</h1>
          <p class="app-page-subtitle">{{ roster?.session.course?.displayName || 'Clase' }}</p>
        </div>
        <div class="app-chip" :class="currentStudent ? 'app-chip--positive' : ''">
          {{ currentStudent ? headerLabel : 'Completo' }}
        </div>
      </section>

      <q-card v-if="!roster" class="app-surface">
        <q-card-section class="app-empty">
          <q-spinner color="primary" size="28px" />
          <div class="q-mt-sm">Cargando roster...</div>
        </q-card-section>
      </q-card>

      <template v-else>
        <q-card class="app-list-card">
          <div class="app-list-card__row">
            <div>
              <h2 class="app-list-card__title">{{ counted.present }} presentes · {{ counted.absent }} ausentes</h2>
              <p class="app-list-card__meta">{{ counted.justified }} justificadas · {{ items.length }} esperados</p>
            </div>
            <q-btn
              flat
              color="negative"
              icon="task_alt"
              label="Completar clase"
              @click="completeSession"
            />
          </div>
        </q-card>

        <q-card v-if="currentStudent" class="student-focus">
          <q-card-section>
            <div class="student-focus__top">
              <div class="text-caption text-uppercase text-weight-bold text-primary">
                {{ isEditingSingleStudent ? 'Editando asistencia' : `Estudiante ${currentIndex + 1} de ${items.length}` }}
              </div>
              <q-btn
                v-if="isSequentialMode && items.length > 0"
                flat
                round
                dense
                icon="arrow_back"
                color="primary"
                :disable="currentIndex <= 0"
                @click="goBack"
              />
            </div>
            <div class="student-focus__name">{{ currentStudent.fullName }}</div>
            <div class="student-focus__meta">{{ currentStudent.studentCode }}</div>

            <div class="row q-col-gutter-sm q-mt-md">
              <div class="col-12">
                <q-btn color="positive" unelevated class="full-width action-btn" label="Asistió" @click="mark('PRESENT')" />
              </div>
              <div class="col-12">
                <q-btn color="negative" unelevated class="full-width action-btn" label="Faltó" @click="mark('ABSENT')" />
              </div>
              <div class="col-12">
                <q-btn color="warning" text-color="dark" unelevated class="full-width action-btn" label="Falta justificada" @click="markJustified" />
              </div>
              <div v-if="isEditingSingleStudent" class="col-12">
                <q-btn flat color="grey-7" class="full-width action-btn action-btn--secondary" label="Cancelar edición" @click="cancelSingleEdit" />
              </div>
            </div>
          </q-card-section>
        </q-card>

        <q-card v-else class="app-surface">
          <q-card-section class="app-empty">
            <div class="app-empty__icon"><q-icon name="task_alt" size="28px" /></div>
            <div>La toma de lista terminó. Puedes cerrar la clase o tocar cualquier estudiante para corregir.</div>
          </q-card-section>
        </q-card>

        <q-card class="app-surface">
          <q-card-section>
            <div class="app-page-head q-mb-sm">
              <div>
                <h2 class="app-page-title" style="font-size:1.05rem;">Progreso</h2>
                <p class="app-page-subtitle">Secuencial, una persona por vez</p>
              </div>
            </div>

            <q-list separator>
              <q-item
                v-for="(item, index) in items"
                :key="item.enrollmentId"
                clickable
                v-ripple
                @click="selectStudent(index)"
              >
                <q-item-section>
                  <q-item-label>{{ item.fullName }}</q-item-label>
                  <q-item-label caption>{{ item.studentCode }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <div class="row items-center q-gutter-sm no-wrap">
                    <div class="app-chip" :class="statusClass(item.status)">
                      {{ statusLabel(item.status) }}
                    </div>
                    <q-btn flat round dense icon="edit" color="primary" @click.stop="selectStudent(index)" />
                  </div>
                </q-item-section>
              </q-item>
            </q-list>
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
import type { AttendanceStatus } from 'src/services/types';
import { useTeacherWorkflowStore } from 'stores/teacher-workflow';

const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const workflow = useTeacherWorkflowStore();
const sessionId = computed(() => String(route.params.sessionId || ''));
const currentIndex = ref(0);
const editIndex = ref<number | null>(null);

const roster = computed(() => workflow.roster);
const items = computed(() => roster.value?.items || []);
const activeIndex = computed(() => editIndex.value ?? currentIndex.value);
const currentStudent = computed(() => items.value[activeIndex.value] || null);
const isEditingSingleStudent = computed(() => editIndex.value !== null);
const isSequentialMode = computed(() => !isEditingSingleStudent.value);
const headerLabel = computed(() =>
  isEditingSingleStudent.value ? 'Editar' : `${currentIndex.value + 1}/${items.value.length}`,
);
const counted = computed(() => ({
  present: items.value.filter((item) => item.status === 'PRESENT').length,
  absent: items.value.filter((item) => item.status === 'ABSENT').length,
  justified: items.value.filter((item) => item.status === 'JUSTIFIED').length,
}));

function syncCurrentIndex() {
  const pendingIndex = items.value.findIndex((item) => !item.status);
  currentIndex.value = pendingIndex === -1 ? items.value.length : pendingIndex;
}

function selectStudent(index: number) {
  editIndex.value = index;
}

function goBack() {
  currentIndex.value = Math.max(currentIndex.value - 1, 0);
}

function cancelSingleEdit() {
  editIndex.value = null;
}

function statusLabel(status: string | null) {
  return {
    PRESENT: 'Asistió',
    ABSENT: 'Faltó',
    JUSTIFIED: 'Justificada',
    null: 'Pendiente',
  }[String(status)] || 'Pendiente';
}

function statusClass(status: string | null) {
  return {
    PRESENT: 'app-chip--positive',
    ABSENT: 'bg-red-1 text-red-8',
    JUSTIFIED: 'bg-amber-2 text-amber-10',
  }[String(status)] || '';
}

async function mark(status: AttendanceStatus, justification?: string) {
  if (!currentStudent.value) return;
  try {
    await workflow.markAttendance(sessionId.value, currentStudent.value.enrollmentId, status, justification);
    if (editIndex.value !== null) {
      editIndex.value = null;
      return;
    }
    currentIndex.value = Math.min(currentIndex.value + 1, items.value.length);
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: error?.response?.data?.message || 'No se pudo registrar la asistencia.',
    });
  }
}

function markJustified() {
  $q.dialog({
    title: 'Falta justificada',
    message: 'Escribe una justificación breve antes de avanzar.',
    prompt: {
      model: '',
      type: 'text',
      label: 'Justificación',
    },
    cancel: true,
    ok: { label: 'Guardar' },
  }).onOk((reason) => {
    void mark('JUSTIFIED', String(reason || '').trim());
  });
}

function completeSession() {
  $q.dialog({
    title: 'Completar clase',
    message: 'No podrás seguir registrando asistencia ni QR después del cierre.',
    cancel: true,
    ok: { label: 'Completar', color: 'negative' },
  }).onOk(async () => {
    await workflow.completeSession(sessionId.value);
    await workflow.fetchWeek();
    $q.dialog({
      title: 'Clase completada',
      message: '¿Qué deseas hacer ahora?',
      cancel: { label: 'Cerrar', flat: true },
      ok: { label: 'Volver a la clase', color: 'primary' },
    }).onOk(() => {
      void router.push({ name: 'current-class' });
    });
  });
}

onMounted(async () => {
  await workflow.fetchRoster(sessionId.value);
  syncCurrentIndex();
});
</script>

<style scoped>
.student-focus {
  background: linear-gradient(180deg, rgba(255, 253, 248, 1), rgba(242, 233, 216, 0.9));
  border-radius: 28px;
  box-shadow: 0 20px 40px rgba(31, 51, 74, 0.12);
}

.student-focus__name {
  margin-top: 12px;
  font-size: 2rem;
  line-height: 1.05;
  font-weight: 800;
}

.student-focus__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.student-focus__meta {
  margin-top: 8px;
  color: #6d7b8c;
  font-size: 1rem;
}

.action-btn {
  min-height: 56px;
  border-radius: 18px;
  font-size: 1rem;
  font-weight: 700;
}

.action-btn--secondary {
  min-height: 48px;
}
</style>
