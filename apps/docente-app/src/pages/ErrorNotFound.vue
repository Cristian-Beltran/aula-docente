<template>
  <q-page class="flex flex-center app-bottom-safe">
    <div class="app-empty">
      <div class="app-empty__icon">
        <q-icon name="error_outline" size="64px" color="grey-5" />
      </div>
      <div class="text-h4 text-weight-bold" style="font-size: 6rem; color: #16324f;">404</div>
      <div class="app-page-subtitle q-mb-md">Página no encontrada</div>
      <q-btn color="primary" unelevated label="Volver al inicio" :to="{ name: 'home' }" />
    </div>
  </q-page>
</template>
