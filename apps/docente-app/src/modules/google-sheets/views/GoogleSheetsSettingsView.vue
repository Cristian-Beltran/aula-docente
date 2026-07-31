<template>
  <q-page class="app-bottom-safe q-pt-md">
    <div class="app-shell app-stack">
      <section class="app-page-head">
        <h1 class="app-page-title">Integraciones</h1>
      </section>

      <q-card class="app-surface">
        <q-card-section>
          <div class="app-page-head q-mb-sm">
            <h2 class="app-page-title" style="font-size:1.05rem;">Google Sheets</h2>
            <span class="app-chip" :class="status.configured ? 'app-chip--positive' : ''">
              {{ status.configured ? 'Conectado' : 'Sin configurar' }}
            </span>
          </div>

          <template v-if="status.configured">
            <div class="q-mb-sm">
              <div class="text-caption text-grey-7">Project ID</div>
              <div class="text-weight-medium">{{ status.projectId }}</div>
            </div>
            <div class="q-mb-sm">
              <div class="text-caption text-grey-7">Cuenta de servicio</div>
              <div class="text-weight-medium">{{ status.clientEmail }}</div>
            </div>
            <div class="q-mb-sm" v-if="status.shareWithEmail">
              <div class="text-caption text-grey-7">Compartir con</div>
              <div class="text-weight-medium">{{ status.shareWithEmail }}</div>
            </div>
            <div class="q-mb-sm">
              <div class="text-caption text-grey-7">Private Key</div>
              <div class="text-weight-medium text-grey-6">{{ maskedKey }}</div>
            </div>
            <div class="row q-gutter-sm">
              <q-btn unelevated color="primary" label="Probar conexión" :loading="testing" @click="test" />
              <q-btn unelevated color="secondary" label="Editar credenciales" icon="edit" @click="openEditor" />
              <q-btn flat color="negative" label="Desconectar" @click="disconnect" />
            </div>
          </template>

          <template v-else>
            <q-card-section class="app-empty q-py-sm">
              <div class="app-empty__icon"><q-icon name="cloud_off" size="26px" /></div>
              <div>Conecta una cuenta de servicio de Google.</div>
              <q-btn unelevated color="primary" label="Configurar credenciales" @click="openNew" class="q-mt-sm" />
            </q-card-section>
          </template>
        </q-card-section>
      </q-card>

      <q-dialog v-model="showForm" persistent>
        <q-card style="min-width: 340px; max-width: 440px; width: 100%">
          <q-card-section>
            <div class="text-h6">{{ isEditing ? 'Editar credenciales' : 'Credenciales de Google' }}</div>
          </q-card-section>
          <q-card-section class="q-gutter-md">
            <q-input v-model="form.projectId" outlined dense label="Project ID" />
            <q-input v-model="form.clientEmail" outlined dense label="Client Email (cuenta de servicio)" />
            <q-input
              v-model="form.privateKey"
              outlined
              dense
              :type="showKey ? 'textarea' : 'password'"
              label="Private Key"
              :hint="isEditing && !form.privateKey ? 'Dejar vacío para conservar la clave actual' : 'Pega la clave privada completa incluyendo BEGIN y END'"
            >
              <template #append>
                <q-btn flat round dense :icon="showKey ? 'visibility_off' : 'visibility'" @click="showKey = !showKey" />
              </template>
            </q-input>
            <q-input v-model="form.shareWithEmail" outlined dense label="Correo del docente (para compartir)" />
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat label="Cancelar" color="grey" @click="showForm = false" />
            <q-btn color="primary" unelevated label="Guardar" :loading="saving" @click="save" />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import { googleSheetsApi, GoogleSheetsStatus } from '../api/googleSheets.api';

const $q = useQuasar();
const status = ref<GoogleSheetsStatus>({ configured: false });
const showForm = ref(false);
const showKey = ref(false);
const saving = ref(false);
const testing = ref(false);
const isEditing = ref(false);
const form = ref({ projectId: '', clientEmail: '', privateKey: '', shareWithEmail: '' });

const maskedKey = computed(() => {
  if (!status.value.configured) return '';
  return '•••••••• (almacenada)';
});

function openEditor() {
  isEditing.value = true;
  form.value.projectId = status.value.projectId || '';
  form.value.clientEmail = status.value.clientEmail || '';
  form.value.privateKey = '';
  form.value.shareWithEmail = status.value.shareWithEmail || '';
  showKey.value = false;
  showForm.value = true;
}

function openNew() {
  isEditing.value = false;
  form.value = { projectId: '', clientEmail: '', privateKey: '', shareWithEmail: '' };
  showKey.value = false;
  showForm.value = true;
}

async function save() {
  saving.value = true;
  try {
    const payload: any = {
      projectId: form.value.projectId,
      clientEmail: form.value.clientEmail,
      shareWithEmail: form.value.shareWithEmail || undefined,
    };
    if (form.value.privateKey) {
      payload.privateKey = form.value.privateKey;
    } else if (isEditing.value) {
      payload.privateKey = 'KEEP_EXISTING';
    } else {
      $q.notify({ type: 'warning', message: 'La clave privada es requerida.' });
      saving.value = false;
      return;
    }
    await googleSheetsApi.saveCredentials(payload);
    showForm.value = false;
    await load();
    $q.notify({ type: 'positive', message: 'Credenciales guardadas.' });
  } catch (e: any) {
    $q.notify({ type: 'negative', message: e?.response?.data?.message || 'Error al guardar.' });
  } finally {
    saving.value = false;
  }
}

async function test() {
  testing.value = true;
  try {
    const { data } = await googleSheetsApi.testConnection();
    $q.notify({
      type: data.connected ? 'positive' : 'warning',
      message: data.connected ? 'Conexión exitosa.' : (data.message || 'Falló la conexión.'),
    });
  } catch {
    $q.notify({ type: 'negative', message: 'Error al probar conexión.' });
  } finally {
    testing.value = false;
  }
}

async function disconnect() {
  $q.dialog({
    title: 'Desconectar',
    message: '¿Eliminar las credenciales? Los Sheets vinculados seguirán existiendo en Drive.',
    cancel: true,
    ok: { label: 'Desconectar', color: 'negative' },
  }).onOk(async () => {
    await googleSheetsApi.removeCredentials();
    status.value = { configured: false };
    $q.notify({ type: 'positive', message: 'Credenciales eliminadas.' });
  });
}

async function load() {
  try {
    const { data } = await googleSheetsApi.getStatus();
    status.value = data;
  } catch { /* ignore */ }
}

onMounted(load);
</script>
