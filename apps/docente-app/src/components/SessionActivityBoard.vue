<template>
  <div v-if="rows.length > 0" class="session-board">
    <table class="session-board__table">
      <thead>
        <tr>
          <th class="session-board__student-header">Estudiante</th>
          <th
            v-for="activity in activities"
            :key="activity.id"
            class="session-board__activity-header"
            :title="activity.title"
          >
            <div class="session-board__activity-title">{{ activity.title }}</div>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.enrollmentId">
          <td class="session-board__student-cell">
            <div class="session-board__student" :class="attendanceClass(row.attendanceStatus)">
              <div class="session-board__student-name">
                <span>{{ splitStudentName(row.fullName).primary }}</span>
                <span>{{ splitStudentName(row.fullName).secondary }}</span>
              </div>
              <div class="session-board__student-meta">
                <span>{{ row.studentCode }}</span>
                <span>{{ formatAttendance(row.attendanceStatus) }}</span>
              </div>
            </div>
          </td>
          <td v-for="cell in row.activities" :key="cell.activityId" class="session-board__grade-cell">
            <div class="session-board__cell">
              <span class="session-board__grade-value">{{ formatActivityValue(cell.gradingMode, cell.value) }}</span>
              <q-btn
                flat
                round
                dense
                size="sm"
                color="primary"
                icon="edit"
                @click="$emit('edit-result', row, cell)"
              />
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div v-else class="app-empty q-py-md">
    <div class="text-caption text-grey-7">{{ emptyText }}</div>
  </div>
</template>

<script setup lang="ts">
import type { ActivityGradingMode, AttendanceStatus, WorkflowSessionBoardCell, WorkflowSessionBoardRow } from 'src/services/types';

defineProps<{
  activities: { id: string; title: string }[];
  rows: WorkflowSessionBoardRow[];
  emptyText: string;
}>();

defineEmits<{
  (event: 'edit-result', row: WorkflowSessionBoardRow, cell: WorkflowSessionBoardCell): void;
}>();

function splitStudentName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) {
    return { primary: fullName, secondary: '' };
  }
  const splitIndex = Math.ceil(parts.length / 2);
  return {
    primary: parts.slice(0, splitIndex).join(' '),
    secondary: parts.slice(splitIndex).join(' '),
  };
}

function attendanceClass(status: AttendanceStatus | null) {
  return {
    PRESENT: 'session-board__student--present',
    LATE: 'session-board__student--late',
    ABSENT: 'session-board__student--absent',
    JUSTIFIED: 'session-board__student--justified',
    EARLY_LEAVE: 'session-board__student--early-leave',
  }[status || ''] || 'session-board__student--pending';
}

function formatAttendance(status: AttendanceStatus | null) {
  if (!status) return 'Pendiente';
  return {
    PRESENT: 'Asistió',
    LATE: 'Tarde',
    ABSENT: 'Faltó',
    JUSTIFIED: 'Justificada',
    EARLY_LEAVE: 'Salió antes',
  }[status] || status;
}

function formatActivityValue(gradingMode: ActivityGradingMode, value: number | null) {
  if (gradingMode === 'SIGNATURES') {
    return value ? `${value}f` : '0f';
  }
  return value === null ? '--' : value.toFixed(0);
}
</script>

<style scoped>
.session-board {
  overflow: auto;
  max-width: 100%;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 18px;
}

.session-board__table {
  width: max-content;
  min-width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background: #fff;
}

.session-board__table th,
.session-board__table td {
  padding: 0;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  text-align: left;
  vertical-align: top;
  background: #fff;
}

.session-board__table th {
  position: sticky;
  top: 0;
  z-index: 3;
  background: #f8fafc;
}

.session-board__student-header {
  left: 0;
  z-index: 5;
  min-width: 204px;
  max-width: 204px;
  padding: 12px;
  font-size: 0.78rem;
  font-weight: 700;
  color: #5b6472;
}

.session-board__activity-header {
  min-width: 88px;
  max-width: 88px;
  width: 88px;
  padding: 10px 8px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #5b6472;
}

.session-board__activity-title {
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  line-height: 1.15;
  word-break: break-word;
}

.session-board__student-cell {
  position: sticky;
  left: 0;
  z-index: 2;
  min-width: 204px;
  max-width: 204px;
  background: #fff;
}

.session-board__student {
  min-height: 72px;
  padding: 10px 12px;
  border-left: 5px solid transparent;
}

.session-board__student--pending {
  border-left-color: #94a3b8;
  color: #475569;
}

.session-board__student--present {
  border-left-color: #16a34a;
  color: #166534;
}

.session-board__student--late {
  border-left-color: #d97706;
  color: #9a3412;
}

.session-board__student--absent {
  border-left-color: #dc2626;
  color: #991b1b;
}

.session-board__student--justified {
  border-left-color: #2563eb;
  color: #1d4ed8;
}

.session-board__student--early-leave {
  border-left-color: #7c3aed;
  color: #6d28d9;
}

.session-board__student-name {
  display: grid;
  gap: 2px;
  font-size: 0.9rem;
  font-weight: 700;
  line-height: 1.15;
}

.session-board__student-name span {
  min-height: 1em;
}

.session-board__student-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 6px;
  font-size: 0.72rem;
  color: #64748b;
}

.session-board__grade-cell {
  min-width: 88px;
  max-width: 88px;
  width: 88px;
}

.session-board__cell {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2px;
  min-height: 72px;
  padding: 8px 6px 8px 8px;
}

.session-board__grade-value {
  font-size: 0.84rem;
  font-weight: 700;
  color: #0f172a;
}

@media (max-width: 768px) {
  .session-board__student-header,
  .session-board__student-cell {
    min-width: 168px;
    max-width: 168px;
  }

  .session-board__activity-header,
  .session-board__grade-cell {
    min-width: 76px;
    max-width: 76px;
    width: 76px;
  }
}
</style>
