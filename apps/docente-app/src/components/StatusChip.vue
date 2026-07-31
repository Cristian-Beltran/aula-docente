<template>
  <q-badge :color="color" text-color="white" class="status-chip">
    {{ label }}
  </q-badge>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  status: string;
}>();

const label = computed(() => {
  const labels: Record<string, string> = {
    ACTIVE: 'Activo',
    DRAFT: 'Borrador',
    CLOSED: 'Cerrado',
    ARCHIVED: 'Archivado',
    PLANNED: 'Planificada',
    OPEN: 'En curso',
    COMPLETED: 'Concluida',
    CANCELED: 'Cancelada',
    PRESENT: 'Presente',
    LATE: 'Retraso',
    ABSENT: 'Ausente',
    JUSTIFIED: 'Justificado',
    PENDING: 'Pendiente',
    APPROVED: 'Aprobada',
    REJECTED: 'Rechazada',
  };
  return labels[props.status] || props.status;
});

const color = computed(() => {
  const map: Record<string, string> = {
    ACTIVE: 'green-7',
    PRESENT: 'green-7',
    APPROVED: 'green-7',
    OPEN: 'green-7',
    COMPLETED: 'green-8',
    LATE: 'amber-7',
    PENDING: 'amber-7',
    PLANNED: 'grey-6',
    ABSENT: 'red-7',
    REJECTED: 'red-7',
    CANCELED: 'grey-6',
    CLOSED: 'grey-6',
    DRAFT: 'grey-6',
    JUSTIFIED: 'blue-6',
  };
  return map[props.status] || 'grey-6';
});
</script>

<style scoped>
.status-chip {
  border-radius: 999px;
  padding: 4px 12px;
  font-size: 0.75rem;
  font-weight: 700;
}
</style>
