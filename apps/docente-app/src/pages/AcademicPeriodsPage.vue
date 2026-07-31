<template>
  <q-page class="app-bottom-safe">
    <div class="app-shell app-stack">
      <section class="app-page-head">
        <div>
          <h1 class="app-page-title">Periodos académicos</h1>
          <p class="app-page-subtitle">Ciclos lectivos del docente</p>
        </div>
        <q-btn color="primary" unelevated icon="add" label="Nuevo" @click="openCreate" />
      </section>

      <q-card v-if="store.loading" class="app-surface">
        <q-card-section class="app-empty">
          <q-spinner color="primary" size="28px" />
          <div class="q-mt-sm">Cargando...</div>
        </q-card-section>
      </q-card>

      <q-card v-else-if="store.items.length === 0" class="app-surface">
        <q-card-section class="app-empty">
          <div class="app-empty__icon"><q-icon name="date_range" size="26px" /></div>
          <div>No hay periodos. Creá uno para empezar.</div>
          <div class="row q-col-gutter-sm q-mt-lg justify-center" style="max-width: 500px; margin: 0 auto">
            <div v-for="preset in quickPresets.slice(0, 3)" :key="preset.label" class="col-6">
              <q-card class="text-center q-pa-md rounded-borders cursor-pointer period-quick" @click="quickCreate(preset)">
                <q-icon :name="preset.icon" size="24px" color="primary" class="q-mb-sm" />
                <div class="text-weight-bold text-body2">{{ preset.label }}</div>
                <div class="text-caption text-grey-7 q-mt-xs">{{ preset.desc }}</div>
              </q-card>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <div v-else class="app-list">
        <q-card v-for="period in store.items" :key="period.id" class="app-list-card">
          <div class="app-list-card__row">
            <div>
              <h2 class="app-list-card__title">{{ period.name }}</h2>
              <p class="app-list-card__meta">
                {{ formatDate(period.startDate) }} – {{ formatDate(period.endDate) }}
              </p>
            </div>
            <StatusChip :status="period.status" />
          </div>
          <div class="row q-gutter-xs q-mt-sm">
            <q-btn v-if="period.status !== 'ACTIVE'" flat dense color="positive" icon="play_arrow" label="Activar" @click="activate(period)" />
            <q-btn v-if="period.status !== 'CLOSED'" flat dense color="warning" icon="lock" label="Cerrar" @click="closePeriod(period)" />
            <q-btn flat dense color="primary" icon="edit" label="Editar" @click="openEdit(period)" />
            <q-btn flat dense color="negative" icon="delete" label="Eliminar" @click="confirmDelete(period)" />
          </div>
        </q-card>
      </div>

      <q-dialog v-model="showForm" persistent>
        <q-card style="min-width: 340px; max-width: 420px; width: 100%">
          <q-card-section>
            <div class="text-h6">{{ editingId ? 'Editar periodo' : 'Crear periodo' }}</div>
          </q-card-section>

          <q-card-section v-if="!editingId" class="q-gutter-sm">
            <div class="text-subtitle2 q-mb-sm">Seleccioná el tipo de ciclo</div>
            <div class="row q-col-gutter-sm">
              <div v-for="preset in quickPresets" :key="preset.label" class="col-6">
                <q-card
                  class="text-center q-pa-sm rounded-borders cursor-pointer period-quick"
                  :class="{ 'period-quick--active': selectedPreset?.label === preset.label }"
                  @click="selectPreset(preset)"
                >
                  <q-icon :name="preset.icon" size="22px" :color="selectedPreset?.label === preset.label ? 'white' : 'primary'" class="q-mb-xs" />
                  <div class="text-weight-bold" style="font-size: 0.85rem">{{ preset.label }}</div>
                  <div class="text-caption" style="font-size: 0.72rem">{{ preset.months }}</div>
                </q-card>
              </div>
            </div>

            <div class="row q-col-gutter-sm q-mt-sm">
              <div class="col-6">
                <q-select v-model="selectedYear" :options="yearOptions" outlined dense label="Año" />
              </div>
              <div class="col-6">
                <q-select v-model="form.status" :options="statusOptions" outlined dense label="Estado" emit-value map-options />
              </div>
            </div>

            <q-input v-model="form.name" outlined dense label="Nombre" placeholder="ej: 2026-1" hint="Se genera automáticamente pero podés cambiarlo." />
          </q-card-section>

          <q-card-section v-else class="q-gutter-md">
            <q-input v-model="form.name" outlined dense label="Nombre" />
            <q-input v-model="form.startDate" outlined dense label="Inicio" type="date" />
            <q-input v-model="form.endDate" outlined dense label="Fin" type="date" />
            <q-select v-model="form.status" :options="statusOptions" outlined dense label="Estado" emit-value map-options />
          </q-card-section>

          <q-card-actions align="right">
            <q-btn flat label="Cancelar" color="grey" @click="showForm = false" />
            <q-btn color="primary" unelevated :label="editingId ? 'Guardar' : 'Crear'" :loading="store.loading" @click="save" />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useAcademicPeriodsStore } from 'stores/academic-periods';
import StatusChip from 'components/StatusChip.vue';

const $q = useQuasar();
const store = useAcademicPeriodsStore();

const showForm = ref(false);
const editingId = ref<string | null>(null);
const selectedPreset = ref<QuickPreset | null>(null);
const selectedYear = ref(new Date().getFullYear());
const form = ref({ name: '', startDate: '', endDate: '', status: 'ACTIVE' });

const currentYear = new Date().getFullYear();
const yearOptions = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];

interface QuickPreset {
  label: string;
  icon: string;
  months: string;
  desc: string;
  startMonth: number;
  endMonth: number;
  suffix: string;
}

const quickPresets: QuickPreset[] = [
  { label: 'Semestre 1', icon: 'looks_one', months: 'Ene – Jun', desc: 'Primer semestre del año', startMonth: 0, endMonth: 5, suffix: '1' },
  { label: 'Semestre 2', icon: 'looks_two', months: 'Jul – Dic', desc: 'Segundo semestre del año', startMonth: 6, endMonth: 11, suffix: '2' },
  { label: 'Año completo', icon: 'calendar_month', months: 'Ene – Dic', desc: 'Año lectivo completo', startMonth: 0, endMonth: 11, suffix: '' },
  { label: 'Verano', icon: 'wb_sunny', months: 'Jun – Ago', desc: 'Curso intensivo de verano', startMonth: 5, endMonth: 7, suffix: 'V' },
];

const statusOptions = [
  { label: 'Activo', value: 'ACTIVE' },
  { label: 'Borrador', value: 'DRAFT' },
  { label: 'Cerrado', value: 'CLOSED' },
];

const autoName = computed(() => {
  if (!selectedPreset.value) return '';
  const s = selectedPreset.value;
  const year = selectedYear.value;
  return `${year}${s.suffix ? '-' + s.suffix : ''}`;
});

function lastDayOfMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function selectPreset(preset: QuickPreset) {
  selectedPreset.value = preset;
  form.value.name = autoName.value;
  form.value.startDate = toDateStr(selectedYear.value, preset.startMonth, 1);
  form.value.endDate = toDateStr(selectedYear.value, preset.endMonth, lastDayOfMonth(selectedYear.value, preset.endMonth));
}

function quickCreate(preset: QuickPreset) {
  const start = toDateStr(currentYear, preset.startMonth, 1);
  const end = toDateStr(currentYear, preset.endMonth, lastDayOfMonth(currentYear, preset.endMonth));
  const name = `${currentYear}${preset.suffix ? '-' + preset.suffix : ''}`;
  saveDirect(name, start, end);
}

async function saveDirect(name: string, startDate: string, endDate: string) {
  try {
    await store.create({ name, startDate, endDate, status: 'ACTIVE' });
    $q.notify({ type: 'positive', message: 'Periodo creado.' });
  } catch {
    $q.notify({ type: 'negative', message: 'Error al crear.' });
  }
}

function openCreate() {
  editingId.value = null;
  selectedPreset.value = null;
  selectedYear.value = currentYear;
  form.value = { name: '', startDate: '', endDate: '', status: 'ACTIVE' };
  showForm.value = true;
}

function openEdit(period: typeof store.items[0]) {
  editingId.value = period.id;
  form.value = {
    name: period.name,
    startDate: period.startDate,
    endDate: period.endDate,
    status: period.status,
  };
  showForm.value = true;
}

async function save() {
  if (!form.value.name || !form.value.startDate || !form.value.endDate) return;
  try {
    if (editingId.value) {
      await store.update(editingId.value, form.value);
      $q.notify({ type: 'positive', message: 'Periodo actualizado.' });
    } else {
      await store.create(form.value);
      $q.notify({ type: 'positive', message: 'Periodo creado.' });
    }
    showForm.value = false;
  } catch (err: any) {
    $q.notify({ type: 'negative', message: err?.response?.data?.message || 'Error al guardar.' });
  }
}

async function activate(period: typeof store.items[0]) {
  try {
    await store.update(period.id, { status: 'ACTIVE' });
    $q.notify({ type: 'positive', message: `"${period.name}" activado.` });
  } catch {
    $q.notify({ type: 'negative', message: 'Error al activar.' });
  }
}

async function closePeriod(period: typeof store.items[0]) {
  try {
    await store.update(period.id, { status: 'CLOSED' });
    $q.notify({ type: 'warning', message: `"${period.name}" cerrado.` });
  } catch {
    $q.notify({ type: 'negative', message: 'Error al cerrar.' });
  }
}

function confirmDelete(period: typeof store.items[0]) {
  $q.dialog({
    title: 'Eliminar periodo',
    message: `¿Eliminar "${period.name}"? Esta acción no se puede deshacer.`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await store.remove(period.id);
      $q.notify({ type: 'positive', message: 'Periodo eliminado.' });
    } catch {
      $q.notify({ type: 'negative', message: 'Error al eliminar.' });
    }
  });
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' });
}

onMounted(() => {
  void store.fetchAll();
});
</script>

<style scoped>
.period-quick {
  border: 2px solid transparent;
  transition: all 0.2s;
}

.period-quick:hover {
  background: rgba(27, 95, 167, 0.04);
}

.period-quick--active {
  background: #1b5fa7;
  color: white;
  border-color: #1b5fa7;
}
</style>
