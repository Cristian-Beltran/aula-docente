<template>
  <q-page class="app-bottom-safe">
    <div class="app-shell app-stack">
      <section class="app-page-head">
        <h1 class="app-page-title">Cursos</h1>
        <q-btn color="primary" unelevated icon="add" label="Nuevo" class="app-compact-btn" @click="createCourse" />
      </section>

      <q-input v-model="search" outlined dense class="app-search" label="Buscar curso o paralelo">
        <template #prepend><q-icon name="search" /></template>
      </q-input>

      <div class="app-list">
        <q-card v-for="course in filteredCourses" :key="course.id" class="app-list-card">
          <div class="app-list-card__row">
            <div>
              <h2 class="app-list-card__title">{{ course.displayName || course.name || 'Curso' }}</h2>
              <p class="app-list-card__meta">
                {{ course.academicPeriod?.name || 'Sin periodo' }} · Paralelo {{ course.parallel }}
              </p>
            </div>
            <q-btn flat color="primary" icon="chevron_right" :to="{ name: 'course-detail', params: { id: course.id } }" />
          </div>
        </q-card>

        <q-card v-if="filteredCourses.length === 0" class="app-surface">
          <q-card-section class="app-empty">
            <div class="app-empty__icon"><q-icon name="school" size="26px" /></div>
            <div>No hay cursos cargados todavía.</div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import { teacherWorkflowService } from 'src/services/teacher-workflow.service';
import { academicPeriodsService } from 'src/services/academic-periods.service';
import { useTeacherWorkflowStore } from 'stores/teacher-workflow';

const workflow = useTeacherWorkflowStore();
const $q = useQuasar();
const search = ref('');

const filteredCourses = computed(() =>
  workflow.courses.filter((course) => {
    const haystack = `${course.displayName || course.name || ''} ${course.parallel} ${course.academicPeriod?.name || ''}`.toLowerCase();
    return haystack.includes(search.value.toLowerCase());
  }),
);

async function createCourse() {
  const name = await new Promise<string | null>((resolve) => {
    $q.dialog({
      title: 'Nombre del curso',
      prompt: { model: '', type: 'text', label: 'Ej. Didáctica I' },
      cancel: true,
      ok: { label: 'Continuar' },
    }).onOk((value) => resolve(String(value || '').trim()))
      .onCancel(() => resolve(null));
  });
  if (!name) return;

  const parallel = await new Promise<string | null>((resolve) => {
    $q.dialog({
      title: 'Paralelo',
      prompt: { model: '', type: 'text', label: 'Ej. A o 1' },
      cancel: true,
      ok: { label: 'Continuar' },
    }).onOk((value) => resolve(String(value || '').trim()))
      .onCancel(() => resolve(null));
  });
  if (!parallel) return;

  const response = await academicPeriodsService.list();
  const periods = response.data;

  if (!periods || periods.length === 0) {
    $q.notify({ type: 'warning', message: 'Primero crea un periodo académico.' });
    return;
  }

  const periodId = await new Promise<string | null>((resolve) => {
    $q.dialog({
      title: 'Semestre',
      options: {
        type: 'radio',
        model: periods[0].id,
        items: periods.map((period) => ({ label: period.name, value: period.id })),
      },
      cancel: true,
      ok: { label: 'Crear curso' },
    }).onOk((value) => resolve(String(value || '')))
      .onCancel(() => resolve(null));
  });
  if (!periodId) return;

  await teacherWorkflowService.createCourse({ name, parallel, academicPeriodId: periodId });
  await workflow.fetchCourses();
  $q.notify({ type: 'positive', message: 'Curso creado.' });
}

onMounted(() => {
  void workflow.fetchCourses();
});
</script>
