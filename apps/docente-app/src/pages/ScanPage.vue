<template>
  <q-page class="app-bottom-safe">
    <div class="app-shell app-stack">
      <section class="app-page-head">
        <div>
          <h1 class="app-page-title">Escáner QR</h1>
          <p class="app-page-subtitle">
            {{ selectedActivity ? selectedActivity.title : 'Selecciona una actividad para continuar' }}
          </p>
        </div>
        <div class="app-chip" :class="cameraActive ? 'app-chip--positive' : ''">
          {{ cameraActive ? 'Escaneando' : 'Preparado' }}
        </div>
      </section>

      <q-card v-if="!session" class="app-surface">
        <q-card-section class="app-empty">
          <div class="app-empty__icon"><q-icon name="play_circle" size="26px" /></div>
          <div>Abre una clase primero. El escáner funciona solo dentro de una clase en progreso.</div>
        </q-card-section>
      </q-card>

      <q-card v-else-if="availableActivities.length === 0" class="app-surface">
        <q-card-section class="app-empty">
          <div class="app-empty__icon"><q-icon name="assignment" size="26px" /></div>
          <div>Crea una actividad abierta desde Clase actual antes de registrar notas o firmas.</div>
        </q-card-section>
      </q-card>

      <template v-else>
        <q-card class="app-surface">
          <q-card-section class="app-stack">
            <q-select
              v-model="selectedActivityId"
              :options="activityOptions"
              emit-value
              map-options
              outlined
              label="Actividad a registrar"
            />

            <q-select
              v-model="selectedEnrollmentId"
              :options="studentOptions"
              emit-value
              map-options
              use-input
              outlined
              clearable
              label="Buscar estudiante por nombre"
              input-debounce="0"
              @filter="filterStudents"
            />

            <div class="row q-col-gutter-sm">
              <div class="col-12 col-sm-6">
                <q-btn
                  v-if="!cameraActive"
                  color="accent"
                  unelevated
                  icon="photo_camera"
                  class="full-width"
                  label="Abrir cámara"
                  :disable="!selectedActivity"
                  @click="startCamera"
                />
                <q-btn
                  v-else
                  color="accent"
                  unelevated
                  icon="stop"
                  class="full-width"
                  label="Detener cámara"
                  @click="stopCamera"
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-btn
                  flat
                  color="primary"
                  icon="person_search"
                  class="full-width"
                  label="Registrar por nombre"
                  :disable="!selectedActivity || !selectedEnrollmentId"
                  @click="registerSelectedStudent"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>

        <q-card class="app-list-card">
          <div class="app-list-card__row">
            <div>
              <h2 class="app-list-card__title">{{ selectedActivity?.title || 'Actividad' }}</h2>
              <p class="app-list-card__meta">
                {{ selectedActivityModeText }}
              </p>
            </div>
            <q-btn flat color="primary" icon="menu_book" label="Volver a clase" :to="{ name: 'current-class' }" />
          </div>
        </q-card>

        <q-card class="scan-panel">
          <q-card-section class="scan-panel__section">
            <div v-if="cameraActive" class="scan-panel__camera scan-panel__camera--active">
              <video ref="videoRef" autoplay playsinline class="scan-panel__video" />
              <canvas ref="canvasRef" class="scan-panel__canvas" />
              <div class="scan-panel__frame"></div>
            </div>
            <div v-else class="scan-panel__camera">
              <div class="scan-panel__frame">
                <q-icon name="qr_code_scanner" size="50px" />
              </div>
            </div>

            <h2 class="scan-panel__title">{{ lastResult?.title || 'Registro listo' }}</h2>
            <p class="scan-panel__text">{{ lastResult?.message || helperText }}</p>
          </q-card-section>
        </q-card>
      </template>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import type { Activity, WorkflowRosterItem } from 'src/services/types';
import { useQuasar } from 'quasar';
import { useTeacherWorkflowStore } from 'stores/teacher-workflow';

const $q = useQuasar();
const workflow = useTeacherWorkflowStore();

const videoRef = ref<HTMLVideoElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const cameraActive = ref(false);
const scanLoop = ref<ReturnType<typeof setInterval> | null>(null);
const lastResult = ref<{ title: string; message: string } | null>(null);
const selectedActivityId = ref<string | null>(null);
const selectedEnrollmentId = ref<string | null>(null);
const studentOptions = ref<Array<{ label: string; value: string }>>([]);

const session = computed(() => workflow.currentSession);
const availableActivities = computed(() => workflow.activities.filter((item) => item.status === 'OPEN'));
const selectedActivity = computed(
  () => availableActivities.value.find((item) => item.id === selectedActivityId.value) || null,
);
const rosterItems = computed(() => workflow.roster?.items || []);
const activityOptions = computed(() =>
  availableActivities.value.map((item) => ({
    label:
      item.gradingMode === 'SCORE_0_100'
        ? `${item.title} · Nota 0-100`
        : `${item.title} · Firmas máx ${item.maxSignatures}`,
    value: item.id,
  })),
);
const selectedActivityModeText = computed(() => {
  if (!selectedActivity.value) return 'Elige una actividad abierta';
  return selectedActivity.value.gradingMode === 'SCORE_0_100'
    ? 'Se pedirá una nota de 0 a 100 por cada estudiante.'
    : `Se pedirá cuántas firmas registrar en esta pasada. Máximo sugerido: ${selectedActivity.value.maxSignatures}.`;
});
const helperText = computed(() => {
  if (!selectedActivity.value) return 'Selecciona la actividad que vas a calificar.';
  return selectedActivity.value.gradingMode === 'SCORE_0_100'
    ? 'Escanea un QR o busca por nombre. Luego ingresa la nota del estudiante.'
    : 'Escanea un QR o busca por nombre. Luego indica cuántas firmas registrar.';
});

async function loadContext() {
  const current = await workflow.fetchCurrentSession();
  if (current?.id) {
    await Promise.all([workflow.fetchActivities(current.id), workflow.fetchRoster(current.id)]);
    if (!selectedActivityId.value && availableActivities.value[0]) {
      selectedActivityId.value = availableActivities.value[0].id;
    }
    resetStudentOptions(rosterItems.value);
  }
}

function resetStudentOptions(items: WorkflowRosterItem[]) {
  studentOptions.value = items.map((item) => ({
    label: `${item.fullName} · ${item.studentCode}`,
    value: item.enrollmentId,
  }));
}

function filterStudents(value: string, update: (callback: () => void) => void) {
  update(() => {
    const term = value.trim().toLowerCase();
    const filtered = term
      ? rosterItems.value.filter((item) =>
          `${item.fullName} ${item.studentCode}`.toLowerCase().includes(term),
        )
      : rosterItems.value;
    resetStudentOptions(filtered);
  });
}

async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 720 }, height: { ideal: 720 } },
    });
    if (videoRef.value) {
      videoRef.value.srcObject = stream;
      await videoRef.value.play();
      cameraActive.value = true;
      scanLoop.value = setInterval(() => void decodeFrame(), 350);
    }
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo acceder a la cámara.' });
  }
}

function stopCamera() {
  if (scanLoop.value) {
    clearInterval(scanLoop.value);
    scanLoop.value = null;
  }
  if (videoRef.value?.srcObject) {
    const stream = videoRef.value.srcObject as MediaStream;
    stream.getTracks().forEach((track) => track.stop());
  }
  if (videoRef.value) {
    videoRef.value.srcObject = null;
  }
  cameraActive.value = false;
}

async function decodeFrame() {
  if (!videoRef.value || !canvasRef.value || !selectedActivity.value) return;
  const canvas = canvasRef.value;
  const video = videoRef.value;
  const context = canvas.getContext('2d');
  if (!context) return;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.drawImage(video, 0, 0);

  try {
    const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
    const matches = await detector.detect(canvas as any);
    if (matches[0]?.rawValue) {
      await processRegistration({ token: matches[0].rawValue });
    }
  } catch {
    // BarcodeDetector no disponible
  }
}

async function promptActivityValue(activity: Activity) {
  if (activity.gradingMode === 'SCORE_0_100') {
    return new Promise<{ score: number } | null>((resolve) => {
      $q.dialog({
        title: 'Registrar nota',
        prompt: {
          model: '',
          type: 'number',
          label: 'Nota entre 0 y 100',
        },
        cancel: true,
        ok: { label: 'Guardar' },
      })
        .onOk((value) => resolve({ score: Number(value) }))
        .onCancel(() => resolve(null));
    });
  }

  return new Promise<{ quantity: number } | null>((resolve) => {
    $q.dialog({
      title: 'Registrar firmas',
      prompt: {
        model: '1',
        type: 'number',
        label: `Cantidad de firmas (${activity.maxSignatures} máximo sugerido)`,
      },
      cancel: true,
      ok: { label: 'Guardar' },
    })
      .onOk((value) => resolve({ quantity: Math.max(1, Number(value || 1)) }))
      .onCancel(() => resolve(null));
  });
}

async function processRegistration(identity: { token?: string; enrollmentId?: string }) {
  if (!selectedActivity.value) return;

  stopCamera();
  const extra = await promptActivityValue(selectedActivity.value);
  if (!extra) return;

  try {
    const { data } = await workflow.scanActivity(selectedActivity.value.id, {
      ...identity,
      ...extra,
    });
    lastResult.value = {
      title: 'Registro correcto',
      message: data.student.fullName || `${data.student.firstName} ${data.student.lastName}`.trim(),
    };
    selectedEnrollmentId.value = null;
    $q.notify({ type: 'positive', message: 'Registro guardado.' });
  } catch (error: any) {
    lastResult.value = {
      title: 'No se pudo registrar',
      message: error?.response?.data?.message || 'Revisa el estado de la clase o la actividad.',
    };
    $q.notify({ type: 'negative', message: lastResult.value.message });
  }
}

async function registerSelectedStudent() {
  if (!selectedEnrollmentId.value) return;
  await processRegistration({ enrollmentId: selectedEnrollmentId.value });
}

onMounted(() => {
  void loadContext();
});

onUnmounted(() => {
  stopCamera();
});
</script>
