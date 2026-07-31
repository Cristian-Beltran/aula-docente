<template>
  <q-page class="app-bottom-safe q-pt-md">
    <div class="app-shell app-stack">
      <section class="app-page-head">
        <div>
          <h1 class="app-page-title">Cronograma</h1>
        </div>
        <div class="app-chip" :class="workflow.weekAgenda?.openSession ? 'app-chip--positive' : ''">
          {{ workflow.weekAgenda?.openSession ? 'Clase en progreso' : 'Sin clase abierta' }}
        </div>
      </section>

      <q-card class="app-surface">
        <q-card-section>
          <div class="week-nav">
            <q-btn flat round icon="chevron_left" @click="moveWeek(-7)" />
            <div class="week-nav__label">
              <div class="text-weight-bold">{{ weekRange }}</div>
            </div>
            <q-btn flat round icon="today" @click="goToCurrentWeek" />
            <q-btn flat round icon="chevron_right" @click="moveWeek(7)" />
          </div>
        </q-card-section>
      </q-card>

      <q-card v-if="workflow.loading" class="app-surface">
        <q-card-section class="app-empty">
          <q-spinner color="primary" size="28px" />
          <div class="q-mt-sm">Cargando agenda semanal...</div>
        </q-card-section>
      </q-card>

      <template v-else>
        <q-card class="app-list-card hero-card" v-if="workflow.weekAgenda?.openSession">
          <div class="app-list-card__row">
            <div>
              <div class="app-list-card__meta">Clase actual</div>
              <h2 class="app-list-card__title">{{ sessionLabel(workflow.weekAgenda.openSession) }}</h2>
              <p class="app-list-card__meta">{{ sessionMeta(workflow.weekAgenda.openSession) }}</p>
            </div>
            <q-btn
              color="primary"
              unelevated
              label="Tomar lista"
              :to="{ name: 'session-attendance', params: { sessionId: workflow.weekAgenda.openSession.id } }"
            />
          </div>
        </q-card>

        <q-card class="app-surface">
          <q-card-section>
            <div class="app-page-head q-mb-sm">
              <div>
                <h2 class="app-page-title" style="font-size:1.05rem;">Clases de la semana</h2>
              </div>
            </div>

            <div class="app-list">
              <q-card
                v-for="day in visibleDays"
                :key="day.date"
                class="app-list-card q-mb-sm"
                :class="{ 'today-card': isToday(day.date) }"
              >
                <div class="app-list-card__row">
                  <div>
                    <h3 style="margin:0;font-size:1rem;">{{ formatDay(day.date) }}</h3>
                    <p class="app-list-card__meta">
                      {{ day.sessions.length }} {{ day.sessions.length === 1 ? 'clase' : 'clases' }}
                    </p>
                  </div>
                  <div v-if="isToday(day.date)" class="app-chip app-chip--positive">Hoy</div>
                </div>

                <q-list separator v-if="day.sessions.length > 0">
                  <q-item v-for="session in day.sessions" :key="session.id">
                    <q-item-section>
                      <q-item-label>{{ sessionLabel(session) }}</q-item-label>
                      <q-item-label caption>{{ sessionMeta(session) }}</q-item-label>
                      <q-item-label caption>
                        <span :class="session.attendanceTaken ? 'text-positive text-weight-bold' : 'text-orange-8'">
                          {{ session.attendanceTaken ? 'Lista tomada' : 'Lista pendiente' }}
                        </span>
                        <span v-if="session.attendanceSummary" class="q-ml-sm">
                          {{ session.attendanceSummary.present }} P · {{ session.attendanceSummary.absent }} A
                        </span>
                      </q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <div class="app-chip" :class="partialClass(session.partialNumber)">
                        P{{ session.partialNumber || 1 }}
                      </div>
                      <q-btn
                        v-if="session.status === 'PLANNED'"
                        color="primary"
                        flat
                        label="Ver clase"
                        :to="{ name: 'session-detail', params: { sessionId: session.id } }"
                      />
                      <q-btn
                        v-else-if="session.status === 'OPEN'"
                        color="primary"
                        flat
                        label="Continuar"
                        :to="{ name: 'current-class' }"
                      />
                      <q-btn
                        v-else
                        color="primary"
                        flat
                        label="Ver clase"
                        :to="{ name: 'session-detail', params: { sessionId: session.id } }"
                      />
                      <div class="text-caption text-grey-7 q-mt-xs text-right">{{ statusText(session.status) }}</div>
                    </q-item-section>
                  </q-item>
                </q-list>

                <q-card-section v-else class="app-empty">
                  <div class="text-caption text-grey-7">Sin clases programadas.</div>
                </q-card-section>
              </q-card>
            </div>
          </q-card-section>
        </q-card>
      </template>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import type { ClassSession } from 'src/services/types';
import { useTeacherWorkflowStore } from 'stores/teacher-workflow';

function toMonday(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function todayStr(): string {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
}

const workflow = useTeacherWorkflowStore();
const selectedDate = ref(toMonday(new Date()));

const weekRange = computed(() => {
  const week = workflow.weekAgenda;
  if (!week) return '';
  const start = new Date(`${week.weekStart}T12:00:00`);
  const end = new Date(`${week.weekEnd}T12:00:00`);
  return `${start.toLocaleDateString('es-BO', { day: 'numeric', month: 'short' })} al ${end.toLocaleDateString('es-BO', { day: 'numeric', month: 'short' })}`;
});

function sessionLabel(session: ClassSession) {
  return session.course?.displayName || session.course?.name || 'Clase';
}

function sessionMeta(session: ClassSession) {
  const start = new Date(session.startsAt).toLocaleString('es-BO', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  const group = session.classGroup ? ` · ${session.classGroup.name}` : '';
  return `${start}${group}`;
}

function formatDay(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('es-BO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function statusText(status: string) {
  return {
    PLANNED: 'Tentativa',
    OPEN: 'Tomando ahora',
    COMPLETED: 'Ya terminó',
    CANCELED: 'Cancelada',
  }[status] || status;
}

function partialClass(n?: number) {
  return {
    1: 'app-chip--positive',
    2: 'app-chip--warning',
    3: 'app-chip--danger',
  }[n || 1] || '';
}

const visibleDays = computed(() => {
  const days = workflow.weekAgenda?.days || [];
  return days.filter((d) => {
    const dayOfWeek = new Date(`${d.date}T12:00:00`).getDay();
    return dayOfWeek !== 0;
  });
});

function isToday(date: string) {
  return date === todayStr();
}

function moveWeek(days: number) {
  const current = new Date(`${selectedDate.value}T12:00:00`);
  current.setDate(current.getDate() + days);
  selectedDate.value = toMonday(current);
  void workflow.fetchWeek(selectedDate.value);
}

function goToCurrentWeek() {
  selectedDate.value = toMonday(new Date());
  void workflow.fetchWeek(selectedDate.value);
}

onMounted(() => {
  void workflow.fetchWeek(selectedDate.value);
});
</script>

<style scoped>
.hero-card {
  background: linear-gradient(135deg, rgba(27, 95, 167, 0.12), rgba(239, 107, 74, 0.14));
}

.week-nav {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  gap: 10px;
  align-items: center;
}

.week-nav__label {
  min-width: 0;
}

.today-card {
  border: 1px solid rgba(27, 95, 167, 0.22);
  box-shadow: 0 10px 26px rgba(27, 95, 167, 0.08);
}
</style>
