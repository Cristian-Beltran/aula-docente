<template>
  <q-page class="app-bottom-safe">
    <div class="app-shell app-stack">
      <section class="app-page-head">
        <div>
          <h1 class="app-page-title">Más</h1>
          <p class="app-page-subtitle">Herramientas complementarias del docente</p>
        </div>
      </section>

      <div class="app-list">
        <q-card class="app-list-card">
          <q-item clickable :to="{ name: 'scan' }">
            <q-item-section avatar><q-icon name="qr_code_scanner" /></q-item-section>
            <q-item-section>
              <q-item-label>Escáner QR</q-item-label>
            </q-item-section>
          </q-item>
        </q-card>

        <q-card class="app-list-card">
          <q-item clickable :to="{ name: 'exceptions' }">
            <q-item-section avatar><q-icon name="warning_amber" /></q-item-section>
            <q-item-section>
              <q-item-label>Excepciones</q-item-label>
            </q-item-section>
          </q-item>
        </q-card>

        <q-card class="app-list-card">
          <q-item clickable :to="{ name: 'students' }">
            <q-item-section avatar><q-icon name="groups" /></q-item-section>
            <q-item-section>
              <q-item-label>Búsqueda de estudiantes</q-item-label>
            </q-item-section>
          </q-item>
        </q-card>

        <q-card class="app-list-card">
          <q-item clickable :to="{ name: 'academic-periods' }">
            <q-item-section avatar><q-icon name="date_range" /></q-item-section>
            <q-item-section>
              <q-item-label>Periodos académicos</q-item-label>
            </q-item-section>
          </q-item>
        </q-card>

        <q-card class="app-list-card">
          <q-item clickable :to="{ name: 'google-sheets-settings' }">
            <q-item-section avatar><q-icon name="table_chart" /></q-item-section>
            <q-item-section>
              <q-item-label>Google Sheets</q-item-label>
            </q-item-section>
          </q-item>
        </q-card>
      </div>
    </div>
  </q-page>
</template>
