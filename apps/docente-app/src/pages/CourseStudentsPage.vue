<template>
  <q-page class="app-bottom-safe">
    <div class="app-shell app-stack">
      <section class="app-page-head">
        <div>
          <h1 class="app-page-title">Estudiantes</h1>
          <p class="app-page-subtitle">{{ course?.subject?.name || 'Curso' }} · Paralelo {{ course?.parallel }}</p>
        </div>
        <q-btn color="primary" unelevated icon="add" label="Cargar lista" @click="bulkRegister" />
      </section>

      <q-card class="app-surface">
        <q-card-section>
          <q-input v-model="studentSearch" outlined dense label="Buscar por nombre o código">
            <template #prepend><q-icon name="search" /></template>
          </q-input>

          <div class="row q-col-gutter-sm q-mt-sm">
            <div class="col-12 col-sm-6">
              <q-btn color="accent" unelevated class="full-width" label="Descargar QRs (PDF)" :loading="downloadingPdf" @click="downloadQrPdf" />
            </div>
            <div class="col-12 col-sm-6">
              <q-btn flat color="primary" class="full-width" label="QR individual" :disable="!selectedEnrollmentId" @click="openSingleQrModal(selectedEnrollmentId)" />
            </div>
          </div>

          <q-list separator class="q-mt-md">
            <q-item v-for="item in studentsPage.items" :key="item.id" clickable :active="selectedEnrollmentId === item.id" active-class="bg-blue-1 text-primary" @click="selectedEnrollmentId = item.id">
              <q-item-section>
                <q-item-label>{{ item.student.firstName }} {{ item.student.lastName }}</q-item-label>
                <q-item-label caption>{{ item.student.studentCode }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-btn flat dense color="primary" icon="qr_code_2" @click.stop="openSingleQrModal(item.id)" />
                <q-btn flat dense color="grey-7" icon="edit" @click.stop="openEditStudent(item)" />
                <q-btn flat dense color="negative" icon="person_remove" @click.stop="confirmRemoveStudent(item)" />
              </q-item-section>
            </q-item>
          </q-list>

          <div v-if="studentsPage.items.length === 0 && !loadingStudents" class="app-empty">
            <div class="app-empty__icon"><q-icon name="person_off" size="26px" /></div>
            <div>No hay estudiantes. Cargá la lista para empezar.</div>
          </div>

          <div class="row items-center justify-between q-mt-md" v-if="studentsPage.totalPages > 1">
            <div class="text-caption text-grey-7">{{ studentsPage.total }} estudiantes · pág {{ studentsPage.page }} de {{ studentsPage.totalPages }}</div>
            <q-pagination v-model="studentPage" :max="studentsPage.totalPages" direction-links />
          </div>
        </q-card-section>
      </q-card>

      <q-dialog v-model="showQrDialog">
        <q-card style="min-width: 300px; max-width: 360px; width: 100%">
          <q-card-section class="text-center">
            <div v-if="qrLoading" class="q-py-lg">
              <q-spinner color="primary" size="28px" />
            </div>
            <template v-else>
              <img v-if="qrImage" :src="qrImage" style="width: 220px; height: 220px" alt="QR" />
              <div class="text-weight-bold q-mt-sm">{{ qrStudentName }}</div>
              <div class="text-caption text-grey-7">{{ qrStudentCode }}</div>
            </template>
          </q-card-section>
          <q-card-actions align="center">
            <q-btn flat label="Cerrar" color="grey" v-close-popup />
            <q-btn
              v-if="qrImage"
              color="primary"
              unelevated
              icon="download"
              label="Descargar"
              @click="downloadQrImage"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <q-dialog v-model="showEditDialog" persistent>
        <q-card style="min-width: 340px; max-width: 400px; width: 100%">
          <q-card-section>
            <div class="text-h6">Editar estudiante</div>
          </q-card-section>
          <q-card-section class="q-gutter-md">
            <q-input v-model="editForm.firstName" outlined dense label="Nombre" />
            <q-input v-model="editForm.lastName" outlined dense label="Apellido" />
            <q-input v-model="editForm.studentCode" outlined dense label="Código" />
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat label="Cancelar" color="grey" @click="showEditDialog = false" />
            <q-btn color="primary" unelevated label="Guardar" :loading="savingEdit" @click="saveEdit" />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import QRCode from 'qrcode';
import type { WorkflowStudentPage } from 'src/services/types';
import { teacherWorkflowService } from 'src/services/teacher-workflow.service';
import { useTeacherWorkflowStore } from 'stores/teacher-workflow';

const route = useRoute();
const $q = useQuasar();
const workflow = useTeacherWorkflowStore();
const courseId = ref(String(route.params.id || ''));
const course = ref<any>(null);
const studentSearch = ref('');
const studentPage = ref(1);
const selectedEnrollmentId = ref<string | null>(null);
const loadingStudents = ref(false);

const showEditDialog = ref(false);
const savingEdit = ref(false);
const editingEnrollmentId = ref<string | null>(null);
const editForm = ref({ firstName: '', lastName: '', studentCode: '' });

const showQrDialog = ref(false);
const qrLoading = ref(false);
const qrImage = ref('');
const qrStudentName = ref('');
const qrStudentCode = ref('');
const downloadingPdf = ref(false);

const studentsPage = ref<WorkflowStudentPage>({
  items: [], total: 0, page: 1, pageSize: 25, totalPages: 1,
});

async function loadCourse() {
  if (workflow.courses.length === 0) await workflow.fetchCourses();
  course.value = workflow.courses.find((c) => c.id === courseId.value) || null;
}

async function loadStudents() {
  loadingStudents.value = true;
  try {
    const { data } = await teacherWorkflowService.listCourseStudents(courseId.value, studentPage.value, studentSearch.value);
    studentsPage.value = data;
  } finally {
    loadingStudents.value = false;
  }
}

async function openSingleQrModal(enrollmentId: string | null) {
  if (!enrollmentId) return;
  showQrDialog.value = true;
  qrLoading.value = true;
  qrImage.value = '';

  const item = studentsPage.value.items.find((i) => i.id === enrollmentId);
  if (item) {
    qrStudentName.value = `${item.student.firstName} ${item.student.lastName}`;
    qrStudentCode.value = item.student.studentCode;
  }

  try {
    const { data } = await teacherWorkflowService.getQrCards(courseId.value, { enrollmentId });
    if (data.length > 0) {
      qrImage.value = await QRCode.toDataURL(data[0].qrToken, {
        margin: 2,
        width: 300,
        color: { dark: '#16324f' },
      });
    }
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo generar el QR.' });
  } finally {
    qrLoading.value = false;
  }
}

function downloadQrImage() {
  if (!qrImage.value) return;
  const a = document.createElement('a');
  a.href = qrImage.value;
  a.download = `${qrStudentName.value.replace(/\s+/g, '_')}.png`;
  a.click();
}

async function downloadQrPdf() {
  downloadingPdf.value = true;
  try {
    const response = await teacherWorkflowService.downloadQrPdf(courseId.value);
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-${course.value?.parallel || 'curso'}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    $q.notify({ type: 'positive', message: 'PDF descargado.' });
  } catch {
    $q.notify({ type: 'negative', message: 'Error al descargar el PDF.' });
  } finally {
    downloadingPdf.value = false;
  }
}

function bulkRegister() {
  $q.dialog({
    title: 'Lista rápida',
    message: 'Escribe un estudiante por línea.',
    prompt: { model: '', type: 'textarea', label: 'Nombres completos' },
    cancel: true, ok: { label: 'Registrar' },
  }).onOk(async (value) => {
    const fullNames = String(value || '').split('\n').map((l) => l.trim()).filter(Boolean);
    await teacherWorkflowService.bulkRegisterStudents(courseId.value, fullNames);
    studentPage.value = 1;
    await loadStudents();
    $q.notify({ type: 'positive', message: 'Estudiantes registrados.' });
  });
}

function openEditStudent(item: WorkflowStudentPage['items'][0]) {
  editingEnrollmentId.value = item.id;
  editForm.value = {
    firstName: item.student.firstName || '',
    lastName: item.student.lastName || '',
    studentCode: item.student.studentCode || '',
  };
  showEditDialog.value = true;
}

async function saveEdit() {
  if (!editingEnrollmentId.value) return;
  savingEdit.value = true;
  try {
    await teacherWorkflowService.updateStudent(courseId.value, editingEnrollmentId.value, {
      firstName: editForm.value.firstName,
      lastName: editForm.value.lastName,
      studentCode: editForm.value.studentCode,
    });
    showEditDialog.value = false;
    await loadStudents();
    $q.notify({ type: 'positive', message: 'Estudiante actualizado.' });
  } catch {
    $q.notify({ type: 'negative', message: 'Error al actualizar.' });
  } finally {
    savingEdit.value = false;
  }
}

function confirmRemoveStudent(item: WorkflowStudentPage['items'][0]) {
  $q.dialog({
    title: 'Quitar estudiante',
    message: `¿Quitar a ${item.student.firstName} ${item.student.lastName} del curso?`,
    cancel: true, ok: { label: 'Quitar', color: 'negative' },
  }).onOk(async () => {
    try {
      await teacherWorkflowService.removeStudent(courseId.value, item.id);
      await loadStudents();
      $q.notify({ type: 'warning', message: 'Estudiante retirado.' });
    } catch {
      $q.notify({ type: 'negative', message: 'Error al retirar.' });
    }
  });
}

let debounce: ReturnType<typeof setTimeout> | null = null;
watch(studentSearch, () => {
  if (debounce) clearTimeout(debounce);
  debounce = setTimeout(() => { studentPage.value = 1; void loadStudents(); }, 250);
});
watch(studentPage, () => { void loadStudents(); });

onMounted(async () => {
  await loadCourse();
  void loadStudents();
});
</script>
