<template>
  <q-btn-toggle
    :model-value="modelValue"
    :options="options"
    spread
    unelevated
    no-caps
    class="att-toggle"
    @update:model-value="$emit('update:modelValue', $event)"
  />
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string;
  options: Array<{ value: string; label: string; attrs?: Record<string, unknown> }>;
}>();

defineEmits<{
  'update:modelValue': [value: string];
}>();
</script>

<style scoped>
.att-toggle :deep(.q-btn) {
  font-size: 0.85rem;
  font-weight: 700;
  border-radius: 10px;
  min-height: 36px;
}
</style>
