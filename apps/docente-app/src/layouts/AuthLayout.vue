<template>
  <q-layout view="lHh Lpr lFf" class="auth-layout">
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
</script>

<style scoped>
.auth-layout {
  background:
    radial-gradient(circle at top left, rgba(27, 95, 167, 0.14), transparent 18rem),
    radial-gradient(circle at bottom right, rgba(239, 107, 74, 0.14), transparent 16rem),
    linear-gradient(180deg, #faf5ec 0%, #f3eadc 100%);
}
</style>
