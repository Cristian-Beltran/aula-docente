<template>
  <q-card class="app-surface">
    <q-card-section>
      <div class="app-page-head q-mb-sm">
        <h2 class="app-page-title" style="font-size:1.05rem;">Google Sheets de la materia</h2>
        <div class="row items-center q-gutter-sm">
          <span class="app-chip" :class="statusClass">{{ statusLabel }}</span>
        </div>
      </div>

      <template v-if="sheet?.configured">
        <div class="q-mb-sm">
          <div class="text-caption text-grey-7">Archivo</div>
          <div class="text-weight-bold">{{ sheet.spreadsheetName }}</div>
          <div class="text-caption text-grey-7">
            Última sincronización:
            {{ sheet.lastSyncedAt ? formatDate(sheet.lastSyncedAt) : 'Nunca' }}
          </div>
        </div>

        <div v-if="sheet.lastError" class="q-mb-sm text-negative text-caption">
          Error: {{ sheet.lastError }}
        </div>

        <div class="row q-col-gutter-sm">
          <div class="col-6">
            <q-btn
              unelevated
              color="primary"
              class="full-width"
              label="Sincronizar ahora"
              icon="sync"
              :loading="syncing"
              @click="sync"
            />
          </div>
          <div class="col-6">
            <q-btn
              unelevated
              color="secondary"
              class="full-width"
              label="Recrear estructura"
              icon="build"
              :loading="rebuilding"
              @click="rebuild"
            />
          </div>
          <div class="col-6">
            <q-btn
              flat
              color="primary"
              class="full-width"
              label="Abrir Sheet"
              icon="open_in_new"
              @click="openSheet"
            />
          </div>
          <div class="col-6">
            <q-btn
              flat
              color="negative"
              class="full-width"
              label="Desvincular"
              icon="link_off"
              @click="unlink"
            />
          </div>
        </div>
      </template>

      <template v-else-if="credentialsConfigured">
        <q-card-section class="app-empty">
          <div class="app-empty__icon"><q-icon name="cloud_off" size="26px" /></div>
          <div>No hay un Sheet vinculado a este curso.</div>
          <div class="row q-col-gutter-sm q-mt-sm justify-center">
            <q-btn
              unelevated
              color="primary"
              label="Crear Google Sheet"
              icon="add"
              :loading="creating"
              @click="create"
            />
            <q-btn
              flat
              color="primary"
              label="Vincular existente"
              icon="link"
              @click="promptLink"
            />
          </div>
        </q-card-section>
      </template>

      <template v-else>
        <q-card-section class="app-empty">
          <div class="app-empty__icon"><q-icon name="settings" size="26px" /></div>
          <div>Configura las credenciales de Google primero.</div>
          <q-btn
            flat
            color="primary"
            label="Ir a configuración"
            :to="{ name: 'google-sheets-settings' }"
            class="q-mt-sm"
          />
        </q-card-section>
      </template>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { googleSheetsApi, CourseSheetStatus, GoogleSheetsStatus } from '../api/googleSheets.api';

const props = defineProps<{ courseId: string }>();
const $q = useQuasar();

const sheet = ref<CourseSheetStatus | null>(null);
const credentialsConfigured = ref(false);
const syncing = ref(false);
const rebuilding = ref(false);
const creating = ref(false);

const statusLabel = computed(() => {
  return { PENDING: 'Pendiente', SYNCED: 'Sincronizado', COMPLETED: 'Sincronizado', FAILED: 'Error', NOT_CONFIGURED: 'Sin configurar' }[sheet.value?.status || ''] || sheet.value?.status || 'Sin configurar';
});

const statusClass = computed(() => {
  return {
    SYNCED: 'app-chip--positive',
    COMPLETED: 'app-chip--positive',
    PENDING: 'app-chip--warning',
    FAILED: 'app-chip--danger',
    NOT_CONFIGURED: '',
  }[sheet.value?.status || ''] || '';
});

async function load() {
  try {
    const [sRes, cRes] = await Promise.all([
      googleSheetsApi.getCourseSheet(props.courseId),
      googleSheetsApi.getStatus(),
    ]);
    sheet.value = sRes.data;
    credentialsConfigured.value = cRes.data.configured;
  } catch {
    // ignore
  }
}

async function create() {
  creating.value = true;
  try {
    const { data } = await googleSheetsApi.createCourseSheet(props.courseId);
    sheet.value = data;
    $q.notify({ type: 'positive', message: 'Sheet creado y sincronizado.' });
  } catch (e: any) {
    $q.notify({ type: 'negative', message: e?.response?.data?.message || 'Error al crear el Sheet.' });
  } finally {
    creating.value = false;
  }
}

async function sync() {
  syncing.value = true;
  try {
    const { data } = await googleSheetsApi.syncCourseSheet(props.courseId);
    sheet.value = data;
    $q.notify({ type: 'positive', message: 'Sincronización completada.' });
  } catch (e: any) {
    $q.notify({ type: 'negative', message: e?.response?.data?.message || 'Error al sincronizar.' });
  } finally {
    syncing.value = false;
  }
}

async function rebuild() {
  rebuilding.value = true;
  try {
    const { data } = await googleSheetsApi.rebuildCourseSheet(props.courseId);
    sheet.value = data;
    $q.notify({ type: 'positive', message: 'Estructura recreada y sincronizada.' });
  } catch (e: any) {
    $q.notify({ type: 'negative', message: e?.response?.data?.message || 'Error al recrear.' });
  } finally {
    rebuilding.value = false;
  }
}

function openSheet() {
  if (sheet.value?.spreadsheetUrl) window.open(sheet.value.spreadsheetUrl, '_blank');
}

function promptLink() {
  $q.dialog({
    title: 'Vincular Sheet existente',
    message: 'Ingresa la URL o ID del archivo.',
    prompt: { model: '', type: 'text', label: 'URL o spreadsheetId' },
    cancel: true,
    ok: { label: 'Vincular' },
  }).onOk(async (value) => {
    try {
      const { data } = await googleSheetsApi.linkCourseSheet(props.courseId, String(value).trim());
      sheet.value = data;
      $q.notify({ type: 'positive', message: 'Sheet vinculado.' });
    } catch (e: any) {
      $q.notify({ type: 'negative', message: e?.response?.data?.message || 'Error al vincular.' });
    }
  });
}

function unlink() {
  $q.dialog({
    title: 'Desvincular',
    message: '¿Quitar el vínculo con el Sheet? El archivo en Drive no se elimina.',
    cancel: true,
    ok: { label: 'Desvincular', color: 'negative' },
  }).onOk(async () => {
    await googleSheetsApi.unlinkCourseSheet(props.courseId);
    sheet.value = null;
    $q.notify({ type: 'positive', message: 'Sheet desvinculado.' });
  });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('es-BO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

watch(() => props.courseId, load);
onMounted(load);
</script>
