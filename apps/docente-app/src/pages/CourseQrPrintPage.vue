<template>
  <q-page class="app-bottom-safe print-page">
    <div class="app-shell app-stack" v-if="course">
      <section class="app-page-head no-print">
        <div>
          <h1 class="app-page-title">Impresión QR</h1>
          <p class="app-page-subtitle">{{ course.displayName || course.name }} · {{ modeLabel }}</p>
        </div>
        <div class="row q-gutter-sm">
          <q-btn flat color="primary" label="Volver" @click="router.back()" />
          <q-btn color="primary" unelevated label="Imprimir" @click="printPage" />
        </div>
      </section>

      <div v-if="loading" class="app-surface q-pa-lg">
        <q-spinner color="primary" size="28px" />
      </div>

      <div v-else :class="mode === 'single' ? 'qr-single' : 'qr-sheet'">
        <article v-for="card in cards" :key="card.enrollmentId" class="qr-card">
          <div class="qr-card__box">
            <img :src="qrMap[card.enrollmentId]" :alt="`QR ${card.student.fullName}`" class="qr-card__image" />
          </div>
          <div class="qr-card__name">{{ card.student.fullName }}</div>
          <div class="qr-card__meta">{{ card.student.studentCode }}</div>
        </article>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTeacherWorkflowStore } from 'stores/teacher-workflow';
import { teacherWorkflowService } from 'src/services/teacher-workflow.service';
import QRCode from 'qrcode';
import type { WorkflowStudentResult } from 'src/services/types';

const route = useRoute();
const router = useRouter();
const workflow = useTeacherWorkflowStore();

const loading = ref(true);
const cards = ref<WorkflowStudentResult[]>([]);
const qrMap = ref<Record<string, string>>({});
const courseId = computed(() => String(route.params.id || ''));
const mode = computed(() => String(route.query.mode || 'sheet'));
const enrollmentId = computed(() => String(route.query.enrollmentId || ''));
const course = computed(() => workflow.courses.find((item) => item.id === courseId.value) || null);
const modeLabel = computed(() => (mode.value === 'single' ? 'QR individual' : 'Planilla para recortar'));

async function load() {
  if (workflow.courses.length === 0) {
    await workflow.fetchCourses();
  }
  const { data } = await teacherWorkflowService.getQrCards(courseId.value, {
    enrollmentId: mode.value === 'single' ? enrollmentId.value : undefined,
  });
  cards.value = data;

  const entries = await Promise.all(
    data.map(async (card) => [
      card.enrollmentId,
      await QRCode.toDataURL(card.qrToken, {
        margin: 1,
        width: mode.value === 'single' ? 360 : 180,
      }),
    ]),
  );
  qrMap.value = Object.fromEntries(entries);
  loading.value = false;
}

function printPage() {
  window.print();
}

onMounted(() => {
  void load();
});
</script>

<style scoped>
.qr-sheet {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 18px;
}

.qr-single {
  display: grid;
  place-items: center;
}

.qr-card {
  padding: 16px;
  border-radius: 20px;
  background: white;
  border: 1px dashed rgba(16, 45, 78, 0.24);
  text-align: center;
  break-inside: avoid;
}

.qr-card__box {
  display: flex;
  justify-content: center;
}

.qr-card__image {
  width: 100%;
  max-width: 180px;
  aspect-ratio: 1;
}

.qr-card__name {
  margin-top: 10px;
  font-weight: 800;
  line-height: 1.2;
}

.qr-card__meta {
  margin-top: 6px;
  color: #6d7b8c;
  font-size: 0.82rem;
}

@media print {
  .no-print {
    display: none !important;
  }

  .print-page {
    background: white !important;
  }

  .qr-sheet {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }

  .qr-card {
    border-radius: 0;
    border: 1px dashed #999;
    padding: 10px;
  }

  .qr-card__image {
    max-width: 150px;
  }
}
</style>
