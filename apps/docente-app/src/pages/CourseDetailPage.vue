<template>
  <q-page class="app-bottom-safe">
    <div class="app-shell app-stack" v-if="course">
      <section class="app-page-head">
        <div>
          <h1 class="app-page-title">{{ course.displayName || course.name }}</h1>
          <p class="app-page-subtitle">
            {{ course.academicPeriod?.name || 'Sin periodo' }} · Paralelo {{ course.parallel }}
          </p>
        </div>
      </section>

      <q-card class="app-surface">
        <q-card-section>
          <q-item clickable :to="{ name: 'course-students', params: { id: courseId } }" class="rounded-borders bg-blue-1">
            <q-item-section avatar>
              <q-icon name="groups" size="28px" color="primary" />
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-weight-bold">Ver alumnos</q-item-label>
              <q-item-label caption>{{ studentsPage.total }} inscritos · Buscar, editar, imprimir QR</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-icon name="chevron_right" />
            </q-item-section>
          </q-item>
          <q-item clickable :to="{ name: 'course-summary', params: { id: courseId } }" class="rounded-borders bg-amber-1 q-mt-sm">
            <q-item-section avatar>
              <q-icon name="grid_view" size="28px" color="warning" />
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-weight-bold">Ver resumen</q-item-label>
              <q-item-label caption>Asistencia y actividades por clase en formato compacto</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-icon name="chevron_right" />
            </q-item-section>
          </q-item>
        </q-card-section>
      </q-card>

        <q-card class="app-surface">
          <q-card-section>
            <div class="app-page-head q-mb-sm">
              <div>
                <h2 class="app-page-title" style="font-size:1.05rem;">Horario semanal</h2>
                <p class="app-page-subtitle">Bloques recurrentes del curso</p>
              </div>
              <q-btn color="primary" unelevated icon="add" label="Agregar" @click="openAddBlock" />
            </div>

            <q-list separator>
              <q-item v-for="(block, index) in schedule" :key="`${block.weekday}-${block.startTime}-${index}`">
                <q-item-section avatar>
                  <q-avatar rounded color="primary" text-color="white" style="font-size:0.7rem;font-weight:800">
                    {{ weekdayShort(block.weekday) }}
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ block.label }}</q-item-label>
                  <q-item-label caption>{{ weekdayLabel(block.weekday) }} · {{ block.startTime }} – {{ block.endTime }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-btn flat dense round color="primary" icon="edit" @click="editBlock(index)" />
                  <q-btn flat dense round color="negative" icon="close" @click="removeBlock(index)" />
                </q-item-section>
              </q-item>
              <q-item v-if="schedule.length === 0">
                <q-item-section class="app-empty q-py-sm">
                  <div class="text-caption text-grey-7">Sin bloques. Agregá al menos uno.</div>
                </q-item-section>
              </q-item>
            </q-list>

            <q-btn
              color="primary"
              unelevated
              class="q-mt-md full-width"
              label="Guardar horario"
              :loading="savingSchedule"
              @click="saveSchedule"
            />
          </q-card-section>
        </q-card>

        <q-dialog v-model="showScheduleForm" persistent>
          <q-card style="min-width: 340px; max-width: 400px; width: 100%">
            <q-card-section>
              <div class="text-h6">{{ editingBlockIndex !== null ? 'Editar bloque' : 'Agregar bloque' }}</div>
            </q-card-section>
            <q-card-section class="q-gutter-md">
              <q-select
                v-model="blockForm.weekday"
                :options="weekdayOptions"
                outlined
                dense
                label="Día"
                emit-value
                map-options
              />
              <div class="row q-col-gutter-sm">
                <div class="col-6">
                  <q-input v-model="blockForm.startTime" outlined dense label="Hora inicio" mask="##:##" hint="Ej: 08:00" />
                </div>
                <div class="col-6">
                  <q-input v-model="blockForm.endTime" outlined dense label="Hora fin" mask="##:##" hint="Ej: 09:30" />
                </div>
              </div>
              <q-input v-model="blockForm.label" outlined dense label="Nombre" hint="Ej: Bloque principal, Laboratorio" />
            </q-card-section>
            <q-card-actions align="right">
              <q-btn flat label="Cancelar" color="grey" @click="showScheduleForm = false" />
              <q-btn color="primary" unelevated :label="editingBlockIndex !== null ? 'Guardar' : 'Agregar'" @click="addOrUpdateBlock" />
            </q-card-actions>
          </q-card>
        </q-dialog>

        <q-card class="app-surface">
          <q-card-section>
            <div class="app-page-head q-mb-sm">
              <h2 class="app-page-title" style="font-size:1.05rem;">Cortes de parciales</h2>
              <q-btn
                color="primary"
                unelevated
                icon="save"
                label="Guardar"
                size="sm"
                :loading="savingPartials"
                @click="savePartials"
              />
            </div>
            <p class="app-page-subtitle q-mb-md">Define las fechas límite. Sesiones anteriores al corte del 1er parcial van automáticamente a P1, y así sucesivamente.</p>
            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <q-input
                  v-model="partialForm.partial1EndsAt"
                  outlined dense label="Corte parcial 1"
                  type="date"
                  :hint="partialForm.partial1EndsAt ? '' : 'Sin definir: todas P1'"
                />
              </div>
              <div class="col-6">
                <q-input
                  v-model="partialForm.partial2EndsAt"
                  outlined dense label="Corte parcial 2"
                  type="date"
                  :hint="partialForm.partial2EndsAt ? '' : 'Sin definir'"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>

      <q-card class="app-surface">
        <q-card-section>
            <div class="app-page-head q-mb-sm">
              <div>
                <h2 class="app-page-title" style="font-size:1.05rem;">Subgrupos por aula</h2>
                <p class="app-page-subtitle">Dividir el curso en grupos con horario propio</p>
              </div>
              <q-btn color="primary" unelevated icon="add" label="Nuevo" @click="showGroupForm = true" />
            </div>

            <q-list separator>
              <q-item v-for="group in groups" :key="group.id">
                <q-item-section>
                  <q-item-label>{{ group.name }}</q-item-label>
                  <q-item-label caption>
                    {{ group.members }} estudiantes · {{ (group.schedule || []).length }} bloques
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <div class="row q-gutter-xs">
                    <q-btn flat dense round color="primary" icon="group_add" @click="editMembers(group)" />
                    <q-btn flat dense round color="primary" icon="edit" @click="editGroup(group)" />
                    <q-btn flat dense round color="negative" icon="delete" @click="removeGroup(group.id)" />
                  </div>
                </q-item-section>
              </q-item>
            </q-list>

            <q-dialog v-model="showGroupForm" persistent>
              <q-card style="min-width: 340px; max-width: 400px; width: 100%">
                <q-card-section>
                  <div class="text-h6">{{ editingGroupId ? 'Editar subgrupo' : 'Nuevo subgrupo' }}</div>
                </q-card-section>
                <q-card-section class="q-gutter-md">
                  <q-input v-model="groupForm.name" outlined dense label="Nombre" placeholder="ej: Grupo A, Laboratorio" />
                  <q-select
                    v-model="groupForm.weekday"
                    :options="weekdayOptions"
                    outlined
                    dense
                    label="Día de clase"
                    emit-value
                    map-options
                  />
                  <div class="row q-col-gutter-sm">
                    <div class="col-6">
                      <q-input v-model="groupForm.startTime" outlined dense label="Hora inicio" mask="##:##" />
                    </div>
                    <div class="col-6">
                      <q-input v-model="groupForm.endTime" outlined dense label="Hora fin" mask="##:##" />
                    </div>
                  </div>
                </q-card-section>
                <q-card-actions align="right">
                  <q-btn flat label="Cancelar" color="grey" @click="showGroupForm = false" />
                  <q-btn color="primary" unelevated :label="editingGroupId ? 'Guardar' : 'Crear'" :loading="creatingGroup" @click="saveGroup" />
                </q-card-actions>
              </q-card>
            </q-dialog>

            <q-dialog v-model="showMembersForm" persistent>
              <q-card style="min-width: 360px; max-width: 480px; width: 100%">
                <q-card-section>
                  <div class="text-h6">{{ editingMembersGroup ? editingMembersGroup.name : 'Asignar estudiantes' }}</div>
                  <div class="text-caption text-grey-7 q-mt-sm">{{ selectedGroupMembers.length }} seleccionados</div>
                </q-card-section>
                <q-card-section>
                  <q-input v-model="memberSearch" outlined dense label="Buscar estudiante" class="q-mb-sm">
                    <template #prepend><q-icon name="search" /></template>
                  </q-input>
                  <div style="max-height: 320px; overflow-y: auto">
                    <q-list dense>
                      <q-item v-for="s in filteredMembers" :key="s.id" clickable v-ripple @click="toggleMember(s.id)" class="q-px-sm">
                        <q-item-section avatar>
                          <q-icon :name="selectedGroupMembers.includes(s.id) ? 'check_box' : 'check_box_outline_blank'" size="24px" :color="selectedGroupMembers.includes(s.id) ? 'primary' : 'grey-5'" />
                        </q-item-section>
                        <q-item-section>
                          <q-item-label>{{ s.student.firstName }} {{ s.student.lastName }}</q-item-label>
                          <q-item-label caption>
                            {{ s.student.studentCode }}
                            <span v-if="memberGroups[s.id]" class="text-warning"> · En {{ memberGroups[s.id] }}</span>
                          </q-item-label>
                        </q-item-section>
                      </q-item>
                    </q-list>
                  </div>
                  <div class="row q-gutter-sm q-mt-sm">
                    <q-btn flat dense color="primary" label="Seleccionar todos" @click="selectAllMembers" />
                    <q-btn flat dense color="grey-7" label="Deseleccionar todos" @click="selectedGroupMembers = []" />
                  </div>
                </q-card-section>
                <q-card-actions align="right">
                  <q-btn flat label="Cancelar" color="grey" @click="showMembersForm = false" />
                  <q-btn color="primary" unelevated label="Guardar" :loading="savingMembers" @click="saveMembers" />
                </q-card-actions>
              </q-card>
            </q-dialog>
        </q-card-section>
      </q-card>

      <q-card class="app-surface">
        <q-card-section>
            <div class="app-page-head q-mb-sm">
              <div>
                <h2 class="app-page-title" style="font-size:1.05rem;">Recuperatorios</h2>
                <p class="app-page-subtitle">Sesiones fuera del horario recurrente</p>
              </div>
              <q-btn color="accent" unelevated icon="add" label="Nueva" @click="openAddSession" />
            </div>

            <q-input v-model="additionalSearch" outlined dense label="Buscar clase" class="q-mb-md">
              <template #prepend><q-icon name="search" /></template>
            </q-input>

            <q-list separator>
              <q-item v-for="session in additionalSessions.items" :key="session.id" clickable v-ripple :to="{ name: 'session-detail', params: { sessionId: session.id } }">
                <q-item-section>
                  <q-item-label>{{ session.topicTaught || 'Recuperatorio' }}</q-item-label>
                  <q-item-label caption>
                    {{ formatDateTime(session.startsAt) }}
                    <span v-if="session.classGroup"> · {{ session.classGroup.name }}</span>
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <StatusChip :status="session.status" />
                  <q-btn v-if="session.status !== 'COMPLETED' && session.status !== 'CLOSED'" flat dense round color="primary" icon="edit" @click.stop="openEditSession(session)" />
                  <q-btn v-if="session.status !== 'COMPLETED' && session.status !== 'CLOSED'" flat dense round color="negative" icon="delete" @click.stop="confirmDeleteSession(session)" />
                </q-item-section>
              </q-item>
            </q-list>

            <div class="row items-center justify-between q-mt-md" v-if="additionalSessions.totalPages > 1">
              <div class="text-caption text-grey-7">
                {{ additionalSessions.total }} clases · página {{ additionalSessions.page }} de {{ additionalSessions.totalPages }}
              </div>
              <q-pagination v-model="additionalPage" :max="additionalSessions.totalPages" direction-links />
            </div>

            <q-dialog v-model="showSessionForm" persistent>
              <q-card style="min-width: 340px; max-width: 400px; width: 100%">
                <q-card-section>
                  <div class="text-h6">{{ editingSessionId ? 'Editar recuperatorio' : 'Nuevo recuperatorio' }}</div>
                </q-card-section>
                <q-card-section class="q-gutter-md">
                  <q-input v-model="sessionForm.date" outlined dense label="Fecha" type="date" />
                  <div class="row q-col-gutter-sm">
                    <div class="col-6">
                      <q-input v-model="sessionForm.startTime" outlined dense label="Hora inicio" mask="##:##" />
                    </div>
                    <div class="col-6">
                      <q-input v-model="sessionForm.endTime" outlined dense label="Hora fin" mask="##:##" />
                    </div>
                  </div>
                  <q-input v-model="sessionForm.label" outlined dense label="Tema" placeholder="ej: Recuperación, Refuerzo" />
                </q-card-section>
                <q-card-actions align="right">
                  <q-btn flat label="Cancelar" color="grey" @click="showSessionForm = false" />
                  <q-btn color="primary" unelevated :label="editingSessionId ? 'Guardar' : 'Crear'" :loading="creatingSession" @click="createAdditionalSession" />
                </q-card-actions>
              </q-card>
            </q-dialog>
        </q-card-section>
      </q-card>

      <CourseSpreadsheetCard :course-id="courseId" />

      <q-card class="app-surface">
        <q-card-section>
          <q-btn
            flat
            color="negative"
            icon="delete_forever"
            label="Eliminar este curso"
            class="full-width"
            @click="confirmDeleteCourse"
          />
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import type { WorkflowAdditionalSessionsPage, WorkflowStudentPage } from 'src/services/types';
import CourseSpreadsheetCard from 'src/modules/google-sheets/components/CourseSpreadsheetCard.vue';
import { teacherWorkflowService } from 'src/services/teacher-workflow.service';
import { useTeacherWorkflowStore } from 'stores/teacher-workflow';
import StatusChip from 'components/StatusChip.vue';

const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const workflow = useTeacherWorkflowStore();
const courseId = computed(() => String(route.params.id || ''));
const course = computed(() => workflow.courses.find((item) => item.id === courseId.value) || null);
const groups = computed(() => workflow.groups);
const schedule = ref<Array<{ weekday: number; startTime: string; endTime: string; label: string }>>([]);
const showScheduleForm = ref(false);
const savingSchedule = ref(false);
const editingBlockIndex = ref<number | null>(null);
const blockForm = ref({ weekday: 1, startTime: '08:00', endTime: '09:30', label: '' });

const savingPartials = ref(false);
const partialForm = ref({ partial1EndsAt: '', partial2EndsAt: '' });

const showGroupForm = ref(false);
const creatingGroup = ref(false);
const groupForm = ref({ name: '', weekday: 1, startTime: '10:00', endTime: '11:00' });
const editingGroupId = ref<string | null>(null);
const showMembersForm = ref(false);
const savingMembers = ref(false);
const editingMembersGroupId = ref<string | null>(null);
const editingMembersGroup = ref<any>(null);
const selectedGroupMembers = ref<string[]>([]);
const memberSearch = ref('');

const showSessionForm = ref(false);
const creatingSession = ref(false);
const editingSessionId = ref<string | null>(null);
const sessionForm = ref({ date: new Date().toISOString().slice(0, 10), startTime: '14:00', endTime: '15:00', label: '' });

const weekdayOptions = [
  { label: 'Lunes', value: 1 },
  { label: 'Martes', value: 2 },
  { label: 'Miércoles', value: 3 },
  { label: 'Jueves', value: 4 },
  { label: 'Viernes', value: 5 },
  { label: 'Sábado', value: 6 },
];

function weekdayShort(value: number) {
  return ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'][value] || 'Lu';
}
const additionalSearch = ref('');
const additionalPage = ref(1);

const studentsPage = ref<WorkflowStudentPage>({
  items: [],
  total: 0,
  page: 1,
  pageSize: 25,
  totalPages: 1,
});

const additionalSessions = ref<WorkflowAdditionalSessionsPage>({
  items: [],
  total: 0,
  page: 1,
  pageSize: 10,
  totalPages: 1,
});
const studentMemberOptions = computed(() =>
  studentsPage.value.items.map((item) => ({
    label: `${item.student.firstName} ${item.student.lastName} · ${item.student.studentCode}`,
    value: item.id,
  })),
);

const filteredMembers = computed(() => {
  const s = memberSearch.value.toLowerCase();
  if (!s) return studentsPage.value.items;
  return studentsPage.value.items.filter(
    (item) =>
      (item.student.firstName || '').toLowerCase().includes(s) ||
      (item.student.lastName || '').toLowerCase().includes(s) ||
      (item.student.studentCode || '').toLowerCase().includes(s),
  );
});

const memberGroups = computed(() => {
  const map: Record<string, string> = {};
  for (const g of groups.value) {
    const ids = g.enrollmentIds || [];
    for (const id of ids) {
      if (g.id !== editingMembersGroupId.value) {
        map[id] = g.name;
      }
    }
  }
  return map;
});

function weekdayLabel(value: number) {
  return ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][value] || 'Lunes';
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('es-BO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function loadStudents() {
  const { data } = await teacherWorkflowService.listCourseStudents(courseId.value, 1);
  studentsPage.value = data;
}

async function loadAllStudents() {
  const { data } = await teacherWorkflowService.listCourseStudents(courseId.value, 1, '', 200);
  studentsPage.value = data;
}

async function loadAdditionalSessions() {
  const { data } = await teacherWorkflowService.listAdditionalSessions(
    courseId.value,
    additionalPage.value,
    additionalSearch.value,
  );
  additionalSessions.value = data;
}

async function load() {
  if (workflow.courses.length === 0) {
    await workflow.fetchCourses();
  }
  await Promise.all([loadStudents(), workflow.fetchGroups(courseId.value), loadAdditionalSessions()]);
  schedule.value = ((course.value?.schedule || []) as any[]).map((item) => ({
    weekday: Number(item.weekday),
    startTime: String(item.startTime),
    endTime: String(item.endTime),
    label: String(item.label),
  }));
  partialForm.value.partial1EndsAt = course.value?.partial1EndsAt || '';
  partialForm.value.partial2EndsAt = course.value?.partial2EndsAt || '';
}

function openAddBlock() {
  editingBlockIndex.value = null;
  blockForm.value = { weekday: 1, startTime: '08:00', endTime: '09:30', label: '' };
  showScheduleForm.value = true;
}

function editBlock(index: number) {
  editingBlockIndex.value = index;
  const b = schedule.value[index];
  blockForm.value = { weekday: b.weekday, startTime: b.startTime, endTime: b.endTime, label: b.label };
  showScheduleForm.value = true;
}

function addOrUpdateBlock() {
  if (!blockForm.value.label.trim()) {
    blockForm.value.label = weekdayLabel(blockForm.value.weekday);
  }
  if (editingBlockIndex.value !== null) {
    schedule.value[editingBlockIndex.value] = { ...blockForm.value };
  } else {
    schedule.value.push({ ...blockForm.value });
  }
  showScheduleForm.value = false;
}

function removeBlock(index: number) {
  schedule.value.splice(index, 1);
}

async function saveSchedule() {
  savingSchedule.value = true;
  try {
    await teacherWorkflowService.saveSchedule(courseId.value, schedule.value);
    await workflow.fetchCourses();
    $q.notify({ type: 'positive', message: 'Horario guardado.' });
  } catch {
    $q.notify({ type: 'negative', message: 'Error al guardar el horario.' });
  } finally {
    savingSchedule.value = false;
  }
}

async function savePartials() {
  savingPartials.value = true;
  try {
    await teacherWorkflowService.updateCourse(courseId.value, {
      partial1EndsAt: partialForm.value.partial1EndsAt || null,
      partial2EndsAt: partialForm.value.partial2EndsAt || null,
    });
    await workflow.fetchCourses();
    $q.notify({ type: 'positive', message: 'Fechas de parciales guardadas.' });
  } catch {
    $q.notify({ type: 'negative', message: 'Error al guardar.' });
  } finally {
    savingPartials.value = false;
  }
}

async function createGroup() {
  creatingGroup.value = true;
  try {
    const { name, weekday, startTime, endTime } = groupForm.value;
    await teacherWorkflowService.createGroup(courseId.value, {
      name,
      schedule: [{ weekday, startTime, endTime, label: name }],
    });
    await workflow.fetchGroups(courseId.value);
    showGroupForm.value = false;
    editingGroupId.value = null;
    groupForm.value = { name: '', weekday: 1, startTime: '10:00', endTime: '11:00' };
    $q.notify({ type: 'positive', message: 'Subgrupo creado.' });
  } catch {
    $q.notify({ type: 'negative', message: 'Error al crear el subgrupo.' });
  } finally {
    creatingGroup.value = false;
  }
}

async function saveGroup() {
  if (editingGroupId.value) {
    creatingGroup.value = true;
    try {
      const { name, weekday, startTime, endTime } = groupForm.value;
      await teacherWorkflowService.updateGroup(courseId.value, editingGroupId.value, {
        name,
        schedule: [{ weekday, startTime, endTime, label: name }],
      });
      await workflow.fetchGroups(courseId.value);
      showGroupForm.value = false;
      editingGroupId.value = null;
      groupForm.value = { name: '', weekday: 1, startTime: '10:00', endTime: '11:00' };
      $q.notify({ type: 'positive', message: 'Subgrupo actualizado.' });
    } catch {
      $q.notify({ type: 'negative', message: 'Error al actualizar el subgrupo.' });
    } finally {
      creatingGroup.value = false;
    }
    return;
  }

  await createGroup();
}

function editGroup(group: any) {
  editingGroupId.value = group.id;
  const firstBlock = (group.schedule || [])[0] || { weekday: 1, startTime: '10:00', endTime: '11:00' };
  groupForm.value = {
    name: group.name,
    weekday: Number(firstBlock.weekday),
    startTime: String(firstBlock.startTime || '10:00'),
    endTime: String(firstBlock.endTime || '11:00'),
  };
  showGroupForm.value = true;
}

function editMembers(group: any) {
  editingMembersGroupId.value = group.id;
  editingMembersGroup.value = group;
  selectedGroupMembers.value = [...(group.enrollmentIds || [])];
  memberSearch.value = '';
  showMembersForm.value = true;
  loadAllStudents();
}

function toggleMember(enrollmentId: string) {
  const current = selectedGroupMembers.value;
  const idx = current.indexOf(enrollmentId);
  if (idx >= 0) {
    selectedGroupMembers.value = current.filter((id) => id !== enrollmentId);
  } else {
    selectedGroupMembers.value = [...current, enrollmentId];
  }
}

function selectAllMembers() {
  selectedGroupMembers.value = studentsPage.value.items.map((s) => s.id);
}

async function saveMembers() {
  if (!editingMembersGroupId.value) return;
  savingMembers.value = true;
  try {
    await teacherWorkflowService.replaceGroupMembers(
      courseId.value,
      editingMembersGroupId.value,
      selectedGroupMembers.value,
    );
    await workflow.fetchGroups(courseId.value);
    showMembersForm.value = false;
    $q.notify({ type: 'positive', message: 'Miembros actualizados.' });
  } catch (err: any) {
    $q.notify({ type: 'negative', message: err?.response?.data?.message || 'Error al guardar miembros.' });
  } finally {
    savingMembers.value = false;
  }
}

function removeGroup(groupId: string) {
  $q.dialog({
    title: 'Eliminar grupo',
    message: 'Se eliminará el grupo y sus membresías actuales.',
    cancel: true,
    ok: { label: 'Eliminar', color: 'negative' },
  }).onOk(async () => {
    await teacherWorkflowService.deleteGroup(courseId.value, groupId);
    await workflow.fetchGroups(courseId.value);
    $q.notify({ type: 'positive', message: 'Grupo eliminado.' });
  });
}

function confirmDeleteSession(session: any) {
  $q.dialog({
    title: 'Eliminar recuperatorio',
    message: `¿Eliminar del ${new Date(session.startsAt).toLocaleDateString()}?`,
    cancel: true,
    ok: { label: 'Eliminar', color: 'negative' },
  }).onOk(async () => {
    try {
      await teacherWorkflowService.deleteAdditionalSession(session.id);
      additionalPage.value = 1;
      await loadAdditionalSessions();
      $q.notify({ type: 'positive', message: 'Recuperatorio eliminado.' });
    } catch {
      $q.notify({ type: 'negative', message: 'Error al eliminar.' });
    }
  });
}

function confirmDeleteCourse() {
  $q.dialog({
    title: 'Eliminar curso',
    message: 'Se eliminará el curso completo con todos sus datos. Esta acción no se puede deshacer.',
    cancel: true,
    ok: { label: 'Eliminar definitivamente', color: 'negative' },
  }).onOk(async () => {
    try {
      await teacherWorkflowService.deleteCourse(courseId.value);
      $q.notify({ type: 'warning', message: 'Curso eliminado.' });
      router.push({ name: 'courses' });
    } catch {
      $q.notify({ type: 'negative', message: 'Error al eliminar el curso.' });
    }
  });
}

function openAddSession() {
  editingSessionId.value = null;
  sessionForm.value = { date: new Date().toISOString().slice(0, 10), startTime: '14:00', endTime: '15:00', label: '' };
  showSessionForm.value = true;
}

function openEditSession(session: any) {
  editingSessionId.value = session.id;
  const d = new Date(session.startsAt);
  const date = d.toISOString().slice(0, 10);
  sessionForm.value = {
    date,
    startTime: d.toTimeString().slice(0, 5),
    endTime: session.endsAt ? new Date(session.endsAt).toTimeString().slice(0, 5) : '15:00',
    label: session.topicTaught || '',
  };
  showSessionForm.value = true;
}

async function createAdditionalSession() {
  creatingSession.value = true;
  try {
    const { date, startTime, endTime, label } = sessionForm.value;
    const startsAt = `${date}T${startTime}:00.000Z`;
    const endsAt = `${date}T${endTime}:00.000Z`;
    if (editingSessionId.value) {
      await teacherWorkflowService.updateAdditionalSession(editingSessionId.value, {
        startsAt, endsAt, topicTaught: label,
      });
      $q.notify({ type: 'positive', message: 'Recuperatorio actualizado.' });
    } else {
      await teacherWorkflowService.createAdditionalSession(courseId.value, {
        startsAt, endsAt, label: label || 'Recuperatorio',
      });
      $q.notify({ type: 'positive', message: 'Recuperatorio creado.' });
    }
    additionalPage.value = 1;
    await loadAdditionalSessions();
    showSessionForm.value = false;
  } catch {
    $q.notify({ type: 'negative', message: 'Error al guardar.' });
  } finally {
    creatingSession.value = false;
  }
}

let additionalDebounce: ReturnType<typeof setTimeout> | null = null;
watch(additionalSearch, () => {
  if (additionalDebounce) clearTimeout(additionalDebounce);
  additionalDebounce = setTimeout(() => {
    additionalPage.value = 1;
    void loadAdditionalSessions();
  }, 250);
});

watch(additionalPage, () => {
  void loadAdditionalSessions();
});

onMounted(() => {
  void load();
});
</script>
